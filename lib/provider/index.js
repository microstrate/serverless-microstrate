'use strict'

const { ServerlessPlugin, constants } = require('../shared')

class MicrostrateProvider extends ServerlessPlugin {
  static getProviderName() {
    return constants.ProviderName
  }

  constructor(serverless, options) {
    super(serverless, options)

    this.provider = this
    this.serverless.setProvider(constants.ProviderName, this)
    // https://www.serverless.com/framework/docs/guides/plugins/custom-configuration
    // https://github.com/serverless/serverless/blob/main/lib/plugins/aws/provider.js#L271
    // https://github.com/serverless/serverless-google-cloudfunctions/blob/master/provider/googleProvider.js#L25
    // TODO
    serverless.configSchemaHandler.defineProvider(constants.ProviderName, {})
  }
}

module.exports = MicrostrateProvider
