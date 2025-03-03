'use strict'

const { mapResourceMappings } = require('../resources')
const { ServerlessPlugin, constants, deployAPI } = require('../shared')

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
    const resources = [
      ...this.mapResources(provider),
      ...this.mapFunctions(serviceName, provider),
    ]

    /**
     * @type {import('../resources/types').Stack}
     */
    const deploymentStack = {
      name: serviceName,
      stage: provider.stage,
      resources: {},
    }

    for (const tplResource of resources) {
      const validationSummary = tplResource.validate()
      if (validationSummary.length > 0) {
        this.logError(
          `Error: Resource '${tplResource.key()}' config contains errors:\n${validationSummary.join('\n')}`,
        )

        // quit deployment
        return
      }

      // TODO check for conflicting resources???
      Object.assign(deploymentStack.resources, tplResource.deploy())
    }

    const httpMappings = this.mapFunctionHttpMappings(provider).reduce(
      (acc, crt) => Object.assign({}, acc, crt.deploy()),
      {},
    )

    // check if gateway is required and not defined
    if (
      Object.keys(httpMappings).length > 0 &&
      Object.values(deploymentStack.resources).findIndex(
        r => r.type === constants.TplMicroStrateGateway,
      ) === -1
    ) {
      // create default one for mappings
      Object.assign(
        deploymentStack.resources,
        ...mapResourceMappings(provider, {
          [`${serviceName}Gateway`]: {
            type: constants.TplMicroStrateGateway,
            deletionPolicy: 'retain',
            properties: { name: `${serviceName}Gateway` },
          },
        }).map(r => r.deploy()),
      )
    }

    return deployAPI
      .deployStack(deploymentStack)
      .then(deployRes => {
        if (
          deployRes.data &&
          deployRes.data.status === 'SUCCESS' &&
          Object.keys(httpMappings).length > 0
        ) {
          const gatewayResource = Object.values(deployRes.data.resources).find(
            r => r.type === constants.TplMicroStrateGateway,
          )
          if (gatewayResource) {
            return deployAPI
              .attachResources({
                name: deploymentStack.name,
                stage: deploymentStack.stage,
                resources: Object.entries(httpMappings).reduce(
                  (acc, [key, cfg]) =>
                    Object.assign({}, acc, {
                      [key]: Object.assign({}, cfg, {
                        properties: Object.assign({}, cfg.properties, {
                          gateway: gatewayResource.properties.url,
                        }),
                      }),
                    }),
                  {},
                ),
              })
              .then(() =>
                deployAPI.getStack({
                  name: serviceName,
                  stage: provider.stage,
                }),
              )
          }
        }

        return deployRes
      })

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
      this.logError(JSON.stringify(output, null, 2))
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
   * @param {string} serviceName
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapFunctions(serviceName, provider) {
    return mapResourceMappings(
      provider,
      Object.entries(this.getFunctions()).reduce(
        (acc, [key, crt]) =>
          Object.assign({}, acc, {
            [key]: Object.assign({}, crt, { service: serviceName }),
          }),
        {},
      ),
      {
        overrideType: 'AWS::Lambda::Function',
        notFoundCb: this.displayAlternativeNotFoundWarning.bind(this),
      },
    )
  }

  /**
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapFunctionHttpMappings(provider) {
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
            key,
            event.http && event.http.path,
            event.http && event.http.method,
            event.httpApi && event.httpApi.method,
            event.httpApi && event.httpApi.path,
            typeof event.httpApi === 'string' && event.httpApi,
            'mapping',
          )]: Object.assign({}, fn, { event }),
        })),
      )
      .reduce((acc, crt) => Object.assign({}, acc, ...crt), {})
    const mappings = functions
      .filter(([_, fn]) => fn.gateway && fn.gateway.length > 0)
      .map(([key, fn]) =>
        fn.gateway.map(gateway => ({
          [buildKey(key, gateway.path, gateway.method, 'mapping')]:
            Object.assign({}, fn, { gateway }),
        })),
      )
      .reduce((acc, crt) => Object.assign({}, acc, ...crt), {})

    return mapResourceMappings(provider, Object.assign({}, events, mappings), {
      overrideType: 'AWS::Lambda::Http:Mapping',
    })
  }

  /**
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapResources(provider) {
    return mapResourceMappings(provider, this.getResources(), {
      notFoundCb: this.displayAlternativeNotFoundWarning.bind(this),
    }).map(targetResource => {
      if (targetResource.migrated) {
        this.logInfo(
          `We migrated resource '${targetResource.key()}'. Template for ${constants.ProviderName}:\n${targetResource.template()}`,
        )
      }

      return targetResource
    })
  }
}

module.exports = MicrostrateDeploy
