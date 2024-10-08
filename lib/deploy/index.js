'use strict'

const { getResourceMapping } = require('../resources')
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
      ...this.mapFunctions(provider),
    ]

    /**
     * @type {import('../resources/types').Stack}
     */
    const deploymentStack = {
      Name: serviceName,
      Resources: {},
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
      Object.assign(deploymentStack.Resources, tplResource.deploy())
    }

    // TODO handle api errors
    return deployAPI.deployStack(deploymentStack)
  }

  /**
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapFunctions(provider) {
    return Object.entries(this.getFunctions())
      .map(([tplKey, tplResource]) => {
        const targetResourceMapping = getResourceMapping(
          constants.TplMicroStrateFunction,
        )
        const targetResource =
          targetResourceMapping &&
          targetResourceMapping(tplKey, tplResource, provider)
        if (!targetResource) {
          this.logWarning(
            `Warning: Could not found compatible resource in ${constants.ProviderName} for resource '${tplKey}'.`,
          )
          return
        }

        return targetResource
      })
      .filter(r => !!r)
  }

  /**
   * @param {import('../resources/types').MicroStrateProviderConfig} provider
   * @returns {import('../resources/types').TplResourceMapping[]}
   */
  mapResources(provider) {
    return Object.entries(this.getResources())
      .map(([tplKey, tplResource]) => {
        const targetResourceMapping = getResourceMapping(tplResource)
        const targetResource =
          targetResourceMapping &&
          targetResourceMapping(tplKey, tplResource, provider)
        if (!targetResource) {
          this.logWarning(
            `Warning: Could not found compatible resource in ${constants.ProviderName} for resource '${tplKey}'.`,
          )
          return
        }

        if (targetResource.migrated) {
          this.logInfo(
            `We migrated resource '${tplKey}'. Template for ${constants.ProviderName}:\n${targetResource.template()}`,
          )
        }

        return targetResource
      })
      .filter(r => !!r)
  }
}

module.exports = MicrostrateDeploy
