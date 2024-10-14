'use strict'

const { ServerlessPlugin, deployAPI } = require('../shared')

class MicrostrateRemove extends ServerlessPlugin {
  constructor(serverless, options) {
    super(serverless, options)

    this.hooks = {
      'remove:remove': () => this.remove(this.serverless.service.service),
    }
  }

  remove(serviceName) {
    return deployAPI
      .removeStack({ Name: serviceName, Stage: provider.stage })
      .then(this.displayRemoveOutput.bind(this))
  }

  /**
   * @param {import('../shared/deploy-api').RemoveStackOutpout} output
   */
  displayRemoveOutput(output) {
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
}

module.exports = MicrostrateRemove
