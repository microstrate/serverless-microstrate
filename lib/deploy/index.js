'use strict'

const { constants, createDeployAPI, mergeObjects } = require('../shared')
const MicrostrateDeployResources = require('./resources')
const { merge } = require('lodash') // coming from sls

/**
 * @param {function(import('../shared/deploy-api').DeployStackOutpout): import('../shared/deploy-api').DeployStackOutpout} fn
 */
const runDeploymentStep = (api, fn) => {
  /**
   * @param {import('../shared/deploy-api').DeployStackOutpout[]} deployments
   */
  return deployments => {
    deployments = deployments || []

    if (api.isSuccessful(...deployments)) {
      return fn(deployments).then(dpl =>
        dpl === undefined ? deployments : deployments.concat(dpl),
      )
    }

    return deployments
  }
}

class MicrostrateDeploy extends MicrostrateDeployResources {
  constructor(serverless, options) {
    super(serverless, options)

    this.hooks = {
      'deploy:deploy': () => this.deploy(),
    }
  }

  deploy() {
    const deployAPI = createDeployAPI(
      this.getApiUrl(),
      this.getApiAccessToken(),
    )
    const stack = {
      name: this.getServiceName(),
      stage: this.getStage(),
    }

    const gatewayMappings = this.mapFunctionGatewayMappings()
    const hasGatewayMappings = gatewayMappings.length > 0
    const gatewayFunctionsMap = this.mapGatewayMappingFunctionMap()
    const resources = this.mapResources(hasGatewayMappings)
    const functions = this.mapFunctions()
    const functionAssets = this.mapFunctionAssets()
    const assetFunctionsMap = this.mapAssetFunctionsMap()

    if (
      !this.validateResources(resources) ||
      !this.validateResources(functions) ||
      !this.validateResources(gatewayMappings)
    ) {
      return
    }

    const steps = [
      // 1. deploy resources
      () =>
        deployAPI.deployStack(
          mergeObjects(stack, {
            resources: this.reduceResourcesToDeploy(resources),
          }),
        ),
      // 2. deploy functions (attaching collection)
      ([resourcesDpl]) => {
        const collectionResource = Object.values(
          resourcesDpl.data.resources,
        ).find(r => r.type === constants.TplMicroStrateCollection)
        if (!collectionResource) {
          throw new Error('function collection resource is missing')
        }

        const namespace = collectionResource.properties.subject.split('.')[2]

        return deployAPI.deployStack(
          mergeObjects(stack, {
            resources: this.reduceResourcesToDeploy(functions, props => {
              props.compute_asset = mergeObjects(props.compute_asset, {
                namespace,
              })
              return props
            }),
          }),
        )
      },
      // 3. deploy assets
      ([_, functionsDpl]) => {
        return Object.entries(assetFunctionsMap)
          .map(([assetKey, functionKey]) => {
            const fn = functionsDpl.data.resources[functionKey]
            if (!fn) {
              throw new Error(`function resource "${functionKey}" is missing`)
            }
            const asset = functionAssets.find(r => r.key() === assetKey)
            if (!asset) {
              throw new Error(`asset resource "${assetKey}" is missing`)
            }

            const [, , namespace, , service] = fn.properties.subject.split('.')

            return this.reduceResourcesToDeploy([asset], {
              namespace,
              service,
            })
          })
          .reduce(
            (chain, res) =>
              chain.then(
                runDeploymentStep(deployAPI, () =>
                  deployAPI.deployStack(
                    mergeObjects(stack, { resources: res }),
                  ),
                ),
              ),
            Promise.resolve([]),
          )
          .then(deployments =>
            deployments.reduce((acc, crt) => merge(acc, crt), {}),
          )
      },
      // 4. deploy gateway mappings
      ([resourcesDpl]) => {
        if (hasGatewayMappings) {
          const gatewayResource = Object.values(
            resourcesDpl.data.resources,
          ).find(r => r.type === constants.TplMicroStrateGateway)
          if (!gatewayResource) {
            throw new Error('gateway resource is missing')
          }

          const gateway = gatewayResource.properties.subject

          return deployAPI.deployStack(
            mergeObjects(stack, {
              resources: this.reduceResourcesToDeploy(gatewayMappings, {
                gateway,
              }),
            }),
          )
        }

        return Promise.resolve()
      },
      // 4. deploy gateway mappings versions
      ([_, functionsDpl, __, mappingsDpl]) => {
        if (hasGatewayMappings) {
          const gatewayMappingVersions = Object.entries(gatewayFunctionsMap)
            .map(([mappingKey, functionKey]) => [
              mappingKey,
              mappingsDpl.data.resources[mappingKey],
              functionsDpl.data.resources[functionKey],
            ])
            .map(([mappingKey, mapping, fn]) => ({
              [`${mappingKey}_version`]: {
                type: constants.TplMicroStrateGatewayMappingVersion,
                properties: {
                  active: true,
                  mapping: mapping.properties.subject,
                  resource: fn.properties.subject,
                  resource_type: 'compute',
                },
              },
            }))
            .reduce((acc, crt) => mergeObjects(acc, crt), {})

          return deployAPI.deployStack(
            mergeObjects(stack, {
              resources: gatewayMappingVersions,
            }),
          )
        }

        return Promise.resolve()
      },
    ]

    return steps
      .reduce(
        (chain, step) => chain.then(runDeploymentStep(deployAPI, step)),
        Promise.resolve(),
      )
      .then(() => deployAPI.getStack(stack))
      .then(this.displayDeployOutput.bind(this))
      .catch(this.displayDeployError.bind(this))
  }

  /**
   * @param {import('../shared/deploy-api').GetStackOutpout} output
   */
  displayDeployOutput(output) {
    if (!output.data || output.data.status === 'FAILED') {
      this.logError(output.message)
    } else if (output.data.status === 'SUCCESS') {
      this.logSuccess(output.message)
    } else {
      // smth else received, assume error & quit
      this.logError(JSON.stringify(output))
      return
    }

    const tab = '  '
    Object.entries((output.data && output.data.result) || {}).map(
      ([key, data]) => {
        this.logInfo(`${tab}Resource '${key}': ${data.status}`)

        if (data.error && data.error !== 'None') {
          this.logError(`${tab}${tab}${data.error}`)
        }
      },
    )
  }

  /**
   * @param {Error} err
   */
  displayDeployError(err) {
    this.logError(err.message)
  }
}

module.exports = MicrostrateDeploy
