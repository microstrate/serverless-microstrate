'use strict'

const { ServerlessPlugin, createDeployAPI } = require('../shared')

class MicrostrateRemove extends ServerlessPlugin {
  constructor(serverless, options) {
    super(serverless, options)

    this.hooks = {
      'remove:remove': () => this.remove(),
    }
  }

  /**
   *
   */
  remove() {
    return createDeployAPI(this.getApiUrl(), this.getApiAccessToken())
      .removeStack({ name: this.getServiceName(), stage: this.getStage() })
      .then(this.displayRemoveOutput.bind(this))
  }

  /**
   * @param {import('../shared/deploy-api').RemoveStackOutpout} output
   */
  displayRemoveOutput(output) {
    if (!output.data) {
      this.logError(output.message)
    }

    const tab = '  '
    Object.entries(output.data || {}).map(([key, data]) => {
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
}

module.exports = MicrostrateRemove
