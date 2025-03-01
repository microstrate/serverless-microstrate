'use strict'

const { mapResourceMappings, mapGatewayResource } = require('../resources')
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

    return (
      deployAPI
        .deployStack(deploymentStack)
        // TODO if success, attach gateway if necessary
        // TODO if success, attach mappings & versions
        .then(this.displayDeployOutput.bind(this))
    )
  }

  /**
   * @param {import('../shared/deploy-api').DeployStackOutpout} output
   */
  displayDeployOutput(output) {
    if (output.status === 'failed') {
      this.logError(output.body.message)
    } else if (output.status === 'success') {
      this.logSuccess(output.body.message)
    } else {
      // smth else received, assume error & quit
      this.logError(JSON.stringify(output, null, 2))
      return
    }

    const tab = '  '
    Object.entries(output.body.data || {}).map(([key, data]) => {
      this.logInfo(`${tab}Resource '${key}': ${data.status}`)

      if (data.errors) {
        data.errors.map(message => this.logError(`${tab}${tab}${message}`))
      }
      if (data.warnings) {
        data.warnings.map(message => this.logWarning(`${tab}${tab}${message}`))
      }
      if (data.infos) {
        data.infos.map(message => this.logInfo(`${tab}${tab}${message}`))
      }
    })
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
