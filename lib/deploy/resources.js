'use strict'

const { mapResourceMappings } = require('../resources')
const {
  ServerlessPlugin,
  constants,
  mergeObjects,
  cloneObj,
} = require('../shared')

class MicrostrateDeployResources extends ServerlessPlugin {
  constructor(serverless, options) {
    super(serverless, options)
  }

  displayAlternativeNotFoundWarning(tplKey) {
    this.logWarning(
      `Warning: Could not find compatible resource in ${constants.ProviderName} for resource '${tplKey}'.`,
    )
  }

  /**
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapFunctions() {
    return mapResourceMappings(this.getProvider(), this.getFunctions(), {
      overrideType: 'AWS::Lambda::Function',
      notFoundCb: this.displayAlternativeNotFoundWarning.bind(this),
    })
  }

  /**
   *
   * @param {string} functionKey
   * @returns {string}
   */
  _buildFunctionAssetKey(functionKey) {
    return `${functionKey}_asset`
  }

  /**
   * @returns {object.<string, string>}
   */
  mapAssetFunctionsMap() {
    return Object.fromEntries(
      Object.keys(this.getFunctions()).map(key => [
        this._buildFunctionAssetKey(key),
        key,
      ]),
    )
  }

  /**
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapFunctionAssets() {
    const layers = Object.fromEntries(
      Object.entries(this.getLayers()).map(([key, l]) => [
        key.toLowerCase(),
        l,
      ]),
    )

    return mapResourceMappings(
      this.getProvider(),
      Object.fromEntries(
        Object.entries(this.getFunctions())
          .map(([key, fn]) => [key, cloneObj(fn)])
          .map(([key, fn]) => {
            fn.layers = (fn.layers || [])
              .map(layerCfg => {
                if (typeof layerCfg === 'string') {
                  return layers[layerCfg.toLowerCase()]
                }

                if (typeof layerCfg === 'object' && layerCfg.Ref) {
                  return (
                    layers[
                      layerCfg.Ref.replace('LambdaLayer', '').toLowerCase()
                    ] || layers[layerCfg.Ref.toLowerCase()]
                  )
                }
              })
              .filter(x => !!x)

            return [key, fn]
          })
          .map(([key, fn]) => [this._buildFunctionAssetKey(key), fn]),
      ),
      {
        overrideType: 'AWS::Lambda::Function::Asset',
        notFoundCb: this.displayAlternativeNotFoundWarning.bind(this),
      },
    )
  }

  /**
   *
   * @param {string[]} parts
   * @returns {string}
   */
  _sanitizeFunctionGatewayMappingKeyParts(...parts) {
    return parts
      .filter(x => !!x)
      .join('_')
      .replace(/[\/: ]/gi, '_')
      .replace(/__/gi, '_')
      .toLowerCase()
  }

  /**
   *
   * @param {string} functionKey
   * @param {object} event
   * @param {object} [event.http]
   * @param {string} [event.http.path]
   * @param {string} [event.http.method]
   * @param {object} [event.httpApi]
   * @param {string} [event.httpApi.path]
   * @param {string} [event.httpApi.method]
   * @returns {string}
   */
  _buildFunctionGatewayMappingHttpKey(functionKey, event) {
    return this._sanitizeFunctionGatewayMappingKeyParts(
      this.getServiceName(),
      functionKey,
      event.http && event.http.path,
      event.http && event.http.method,
      event.httpApi && event.httpApi.method,
      event.httpApi && event.httpApi.path,
      typeof event.httpApi === 'string' && event.httpApi,
      'mapping',
    )
  }

  /**
   *
   * @param {string} functionKey
   * @param {object} gateway
   * @param {string} gateway.path
   * @param {string} gateway.method
   * @returns {string}
   */
  _buildFunctionGatewayMappingGatewayKey(functionKey, gateway) {
    return this._sanitizeFunctionGatewayMappingKeyParts(
      this.getServiceName(),
      functionKey,
      gateway.path,
      gateway.method,
      'mapping',
    )
  }

  /**
   * @returns {object.<string, [string, any]>}
   */
  _flattenFunctionHttpEvents() {
    const functions = Object.entries(this.getFunctions())
    const httpEvents = functions
      .filter(([_, fn]) => fn.events && fn.events.length > 0)
      .map(([key, fn]) =>
        fn.events
          .filter(event => event.http || event.httpApi)
          .map(event => ({
            [this._buildFunctionGatewayMappingHttpKey(key, event)]: [
              key,
              mergeObjects(fn, { event }),
            ],
          })),
      )
      .reduce((acc, crt) => acc.concat(...crt), [])
    const gatewayEvents = functions
      .filter(([_, fn]) => fn.gateway && fn.gateway.length > 0)
      .map(([key, fn]) =>
        fn.gateway.map(gateway => ({
          [this._buildFunctionGatewayMappingGatewayKey(key, gateway)]: [
            key,
            mergeObjects(fn, { gateway }),
          ],
        })),
      )
      .reduce((acc, crt) => acc.concat(...crt), [])

    return mergeObjects(...httpEvents, ...gatewayEvents)
  }

  /**
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapFunctionGatewayMappings() {
    const provider = this.getProvider()

    return mapResourceMappings(
      provider,
      Object.fromEntries(
        Object.entries(this._flattenFunctionHttpEvents()).map(
          ([key, [_, mapping]]) => [key, mapping],
        ),
      ),
      { overrideType: 'AWS::Lambda::Http:Mapping' },
    )
  }

  /**
   * @returns {object.<string, string>}
   */
  mapGatewayMappingFunctionMap() {
    return Object.fromEntries(
      Object.entries(this._flattenFunctionHttpEvents()).map(
        ([key, [fnKey]]) => [key, fnKey],
      ),
    )
  }

  /**
   * @param {boolean} gatewayRequired
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapResources(gatewayRequired) {
    const serviceName = this.getServiceName()
    const provider = this.getProvider()
    const collectionTopic = this.getCollectionTopic()

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
          deletion_policy: 'retain',
          properties: {
            name: serviceName,
            collection_type: 'function',
            subject: collectionTopic
              ? `ms.compute.${collectionTopic}.collection`
              : undefined,
          },
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
            deletion_policy: 'retain',
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

module.exports = MicrostrateDeployResources
