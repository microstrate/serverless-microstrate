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
    const gatewayMappings = this.mapFunctionHttpMappings(serviceName, provider)
    const hasGatewayMappings = gatewayMappings.length > 0
    const resources = this.mapResources(
      serviceName,
      provider,
      hasGatewayMappings,
    )
    const functions = this.mapFunctions(provider)

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

            return functions.reduce(
              (chain, res) =>
                chain.then(dpl =>
                  dpl === 'START' || deployAPI.isSuccessful(dpl)
                    ? deployAPI.deployStack(
                        mergeObjects(stack, {
                          resources: this.reduceResourcesToDeploy(
                            [res],
                            props => {
                              props.compute_asset = mergeObjects(
                                props.compute_asset,
                                { namespace },
                              )
                              return props
                            },
                          ),
                        }),
                      )
                    : dpl,
                ),
              Promise.resolve('START'),
            )
          }
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
   * @param {string} serviceName
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapFunctionHttpMappings(serviceName, provider) {
    const functions = Object.entries(this.getFunctions())
    const buildKey = (...parts) =>
      parts
        .filter(x => !!x)
        .join('_')
        .replace(/[\/: ]/gi, '_')
        .replace(/__/gi, '_')
        .toLowerCase()
    const events = functions
      .filter(([_, fn]) => fn.events && fn.events.length > 0)
      .map(([key, fn]) =>
        fn.events.map(event => ({
          [buildKey(
            serviceName,
            key,
            event.http && event.http.path,
            event.http && event.http.method,
            event.httpApi && event.httpApi.method,
            event.httpApi && event.httpApi.path,
            typeof event.httpApi === 'string' && event.httpApi,
            'mapping',
          )]: mergeObjects(fn, { event }),
        })),
      )
      .reduce((acc, crt) => mergeObjects(acc, ...crt), {})
    const mappings = functions
      .filter(([_, fn]) => fn.gateway && fn.gateway.length > 0)
      .map(([key, fn]) =>
        fn.gateway.map(gateway => ({
          [buildKey(serviceName, key, gateway.path, gateway.method, 'mapping')]:
            mergeObjects(fn, { gateway }),
        })),
      )
      .reduce((acc, crt) => mergeObjects(acc, ...crt), {})

    return mapResourceMappings(provider, mergeObjects(events, mappings), {
      overrideType: 'AWS::Lambda::Http:Mapping',
    })
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
            properties: { name: `${serviceName}Gateway` },
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
