'use strict'

const { getResourceMapping } = require('../resources')
const { ServerlessPlugin, constants } = require('../shared')

class MicrostrateDeploy extends ServerlessPlugin {
  constructor(serverless, options) {
    super(serverless, options)

    this.hooks = {
      'deploy:deploy': () =>
        Promise.resolve()
          .then(this.deployResources.bind(this))
          .then(this.deployFunctions.bind(this)),
    }
  }

  deployFunctions() {
    return Promise.all(
      Object.entries(this.getFunctions()).map(([tplKey, tplResource]) => {
        this.logInfo(
          getResourceMapping(constants.TplMicroStrateFunction)(
            tplKey,
            tplResource,
            this.serverless.service.provider,
          ).template(),
        )

        return Promise.resolve()
      }),
    )
  }

  deployResources() {
    return Promise.all(
      Object.entries(this.getResources()).map(([tplKey, tplResource]) => {
        const targetResourceMapping = getResourceMapping(tplResource)
        const targetResource =
          targetResourceMapping &&
          targetResourceMapping(
            tplKey,
            tplResource,
            this.serverless.service.provider,
          )
        if (!targetResource) {
          this.logWarning(
            `Warning: Could not found compatible resource in ${constants.ProviderName} for resource '${tplKey}'.`,
          )
          return Promise.resolve()
        }

        if (targetResource.migrated) {
          this.logInfo(
            `We migrated resource '${tplKey}'. Template for ${constants.ProviderName}:\n${targetResource.template()}`,
          )
        }

        return Promise.resolve()
      }),
    )
  }
}

module.exports = MicrostrateDeploy
