'use strict'

const { mapResourceMappings } = require('../resources')
const {
  ServerlessPlugin,
  constants,
  deployAPI,
  mergeObjects,
} = require('../shared')

class MicrostrateDeploy extends ServerlessPlugin {
  constructor(serverless, options) {
    super(serverless, options)

    this.hooks = {
      'deploy:deploy': () =>
        this.deploy(
          this.serverless.service.service,
          this.serverless.service.provider,
        ),
    }
  }

  /**
   *
   * @param {string} serviceName
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   */
  deploy(serviceName, provider) {
    // 1. deploy resources
    // 2. attach functions (attaching collection)
    // 2.1 if its update? separate fn config and & asset ???
    // 3. attach mappings
    // 4. attach versions linked to mappings

    const stack = {
      name: serviceName,
      stage: provider.stage,
    }

    // determines if we require gateway
    const [gatewayMappings, fnMappingsMap] = this.mapFunctionHttpMappings(
      serviceName,
      provider,
    )

    const hasGatewayMappings = gatewayMappings.length > 0
    const resources = this.mapResources(
      serviceName,
      provider,
      hasGatewayMappings,
    )
    const functions = this.mapFunctions(provider)
    const [functionAssets, fnAssetMap] = this.mapFunctionAssets(provider)

    if (
      !this.validateResources(resources) ||
      !this.validateResources(functions) ||
      !this.validateResources(gatewayMappings)
    ) {
      return
    }

    return deployAPI
      .deployStack(
        mergeObjects(stack, {
          resources: this.reduceResourcesToDeploy(resources),
        }),
      )
      .then(deployment => {
        if (deployAPI.isSuccessful(deployment)) {
          const collectionResource = Object.values(
            deployment.data.resources,
          ).find(r => r.type === constants.TplMicroStrateCollection)
          if (collectionResource) {
            const namespace =
              collectionResource.properties.subject.split('.')[1]

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
          }
        }

        return deployment
      })
      .then(deployment => {
        if (deployAPI.isSuccessful(deployment)) {
          const assets = Object.entries(fnAssetMap)
            .map(([fnKey, assetKeys]) => {
              const fn = deployment.data.resources[fnKey]
              if (!fn) {
                return []
              }
              const [, namespace, , service] = fn.properties.subject.split('.')

              return this.reduceResourcesToDeploy(
                functionAssets.filter(r => assetKeys.includes(r.key())),
                { namespace, service },
              )
            })
            .reduce((acc, crt) => acc.concat(crt), [])

          return assets.reduce(
            (chain, res) =>
              chain.then(dpl =>
                dpl === 'START' || deployAPI.isSuccessful(dpl)
                  ? deployAPI.deployStack(
                      mergeObjects(stack, { resources: res }),
                    )
                  : dpl,
              ),
            Promise.resolve('START'),
          )
        }

        return deployment
      })
      .then(deployment => {
        if (deployAPI.isSuccessful(deployment) && hasGatewayMappings) {
          return deployAPI
            .getStack(stack)
            .then(currentStack =>
              Object.values(currentStack.data.resources).find(
                r => r.type === constants.TplMicroStrateGateway,
              ),
            )
            .then(gatewayResource => {
              if (gatewayResource) {
                const gateway = gatewayResource.properties.subject

                return deployAPI.deployStack(
                  mergeObjects(stack, {
                    resources: this.reduceResourcesToDeploy(gatewayMappings, {
                      gateway,
                    }),
                  }),
                )
              }

              return deployment
            })
        }

        return deployment
      })
      .then(deployment => {
        if (deployAPI.isSuccessful(deployment) && hasGatewayMappings) {
          return deployAPI
            .getStack(stack)
            .then(currentStack =>
              Object.entries(fnMappingsMap)
                .map(([fnKey, mappingKeys]) =>
                  [
                    currentStack.data.resources[fnKey],
                    mappingKeys.map(mappingKey =>
                      currentStack.data.resources[mappingKey]
                        ? mergeObjects(
                            currentStack.data.resources[mappingKey],
                            { mappingKey },
                          )
                        : undefined,
                    ),
                  ].filter(x => !!x),
                )
                .filter(([fn, mappings]) => !!fn && mappings.length > 0)
                .map(([fn, mappings]) =>
                  mappings.map(mapping => ({
                    [`${mapping.mappingKey}_version`]: {
                      type: constants.TplMicroStrateGatewayMappingVersion,
                      properties: {
                        active: true,
                        mapping: mapping.properties.subject,
                        resource: fn.properties.subject,
                        resourceType: 'compute',
                      },
                    },
                  })),
                )
                .reduce((acc, crt) => mergeObjects(acc, ...crt), {}),
            )
            .then(gatewayMappingVersions => {
              if (
                gatewayMappingVersions &&
                Object.keys(gatewayMappingVersions).length > 0
              ) {
                return deployAPI.deployStack(
                  mergeObjects(stack, {
                    resources: gatewayMappingVersions,
                  }),
                )
              }

              return deployment
            })
        }

        return deployment
      })
      .then(() => deployAPI.getStack(stack))
      .then(this.displayDeployOutput.bind(this))
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

  displayAlternativeNotFoundWarning(tplKey) {
    this.logWarning(
      `Warning: Could not found compatible resource in ${constants.ProviderName} for resource '${tplKey}'.`,
    )
  }

  /**
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapFunctions(provider) {
    return mapResourceMappings(provider, this.getFunctions(), {
      overrideType: 'AWS::Lambda::Function',
      notFoundCb: this.displayAlternativeNotFoundWarning.bind(this),
    })
  }

  /**
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @returns {[import('../resources/types').TplResourceMapping[], object.<string, string[]>]}
   */
  mapFunctionAssets(provider) {
    const fnAssetMap = {}
    const addFnAsset = (fnKey, assetKey) => {
      if (fnAssetMap[fnKey]) {
        fnAssetMap[fnKey] = fnAssetMap[fnKey].concat(assetKey)
      } else {
        fnAssetMap[fnKey] = [assetKey]
      }
    }

    return [
      mapResourceMappings(
        provider,
        Object.entries(this.getFunctions())
          .map(([key, fn]) => {
            addFnAsset(key, `${key}_asset`)

            return [key, fn]
          })
          .reduce(
            (acc, [key, fn]) => mergeObjects(acc, { [`${key}_asset`]: fn }),
            {},
          ),
        {
          overrideType: 'AWS::Lambda::Function::Asset',
          notFoundCb: this.displayAlternativeNotFoundWarning.bind(this),
        },
      ),
      fnAssetMap,
    ]
  }

  /**
   * @param {string} serviceName
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @returns {[import('../resources/types').TplResourceMapping[], object.<string, string[]>]}
   */
  mapFunctionHttpMappings(serviceName, provider) {
    const buildKey = (...parts) =>
      parts
        .filter(x => !!x)
        .join('_')
        .replace(/[\/: ]/gi, '_')
        .replace(/__/gi, '_')
        .toLowerCase()

    const fnMappingMap = {}
    const addFnMapping = (fnKey, mappingKey) => {
      if (fnMappingMap[fnKey]) {
        fnMappingMap[fnKey] = fnMappingMap[fnKey].concat(mappingKey)
      } else {
        fnMappingMap[fnKey] = [mappingKey]
      }
    }

    const functions = Object.entries(this.getFunctions())
    const events = functions
      .filter(([_, fn]) => fn.events && fn.events.length > 0)
      .map(([key, fn]) =>
        fn.events
          .filter(event => event.http || event.httpApi || event.gateway)
          .map(event => {
            const mappingKey = buildKey(
              serviceName,
              key,
              event.http && event.http.path,
              event.http && event.http.method,
              event.httpApi && event.httpApi.method,
              event.httpApi && event.httpApi.path,
              typeof event.httpApi === 'string' && event.httpApi,
              'mapping',
            )

            addFnMapping(key, mappingKey)

            return {
              [mappingKey]: mergeObjects(fn, { event }),
            }
          }),
      )
      .reduce((acc, crt) => mergeObjects(acc, ...crt), {})
    const mappings = functions
      .filter(([_, fn]) => fn.gateway && fn.gateway.length > 0)
      .map(([key, fn]) =>
        fn.gateway.map(gateway => {
          const mappingKey = buildKey(
            serviceName,
            key,
            gateway.path,
            gateway.method,
            'mapping',
          )

          addFnMapping(key, mappingKey)

          return {
            [mappingKey]: mergeObjects(fn, { gateway }),
          }
        }),
      )
      .reduce((acc, crt) => mergeObjects(acc, ...crt), {})

    return [
      mapResourceMappings(provider, mergeObjects(events, mappings), {
        overrideType: 'AWS::Lambda::Http:Mapping',
      }),
      fnMappingMap,
    ]
  }

  /**
   * @param {string} serviceName
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @param {boolean} gatewayRequired
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapResources(serviceName, provider, gatewayRequired) {
    let resources = mapResourceMappings(provider, this.getResources(), {
      notFoundCb: this.displayAlternativeNotFoundWarning.bind(this),
    }).map(targetResource => {
      if (targetResource.migrated) {
        this.logInfo(
          `We migrated resource '${targetResource.key()}'. Template for ${constants.ProviderName}:\n${targetResource.template()}`,
        )
      }

      return targetResource
    })

    resources = resources.concat(
      mapResourceMappings(provider, {
        [`${serviceName}Collection`]: {
          type: constants.TplMicroStrateCollection,
          properties: { name: `${serviceName} Service` },
        },
      }),
    )

    // check if gateway is required and not defined
    if (
      gatewayRequired &&
      resources.findIndex(r => r.type() === constants.TplMicroStrateGateway) ===
        -1
    ) {
      resources = resources.concat(
        mapResourceMappings(provider, {
          [`${serviceName}Gateway`]: {
            type: constants.TplMicroStrateGateway,
            deletionPolicy: 'retain',
            properties: { name: `${serviceName}Gateway`, active: true },
          },
        }),
      )
    }

    return resources
  }

  /**
   * @param {import('../resources/types').TplResourceMapping[]} resources
   * @returns {boolean}
   */
  validateResources(resources) {
    for (const tplResource of resources) {
      const validationSummary = tplResource.validate()
      if (validationSummary.length > 0) {
        this.logError(
          `Error: Resource '${tplResource.key()}' config contains errors:\n${validationSummary.join('\n')}`,
        )

        // quit deployment
        return false
      }

      // TODO check for conflicting resources???
    }

    return true
  }

  /**
   * @param {import('../resources/types').TplResourceMapping[]} resources
   * @param {object|Function} [extraProps]
   * @returns {object}
   */
  reduceResourcesToDeploy(resources, extraProps) {
    return resources.reduce(
      (acc, crt) =>
        mergeObjects(
          acc,
          Object.entries(crt.deploy()).reduce(
            (acc, [key, obj]) =>
              mergeObjects(acc, {
                [key]: mergeObjects(obj, {
                  properties:
                    typeof extraProps === 'function'
                      ? extraProps(obj.properties)
                      : mergeObjects(obj.properties, extraProps),
                }),
              }),
            {},
          ),
        ),
      {},
    )
  }
}

module.exports = MicrostrateDeploy
