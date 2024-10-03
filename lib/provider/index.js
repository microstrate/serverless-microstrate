'use strict'

const constants = {
  providerName: 'microstrate',
}

class MicrostrateProvider {
  static getProviderName() {
    return constants.providerName
  }

  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this
    this.serverless.setProvider(constants.providerName, this)
    // https://www.serverless.com/framework/docs/guides/plugins/custom-configuration
    // https://github.com/serverless/serverless/blob/main/lib/plugins/aws/provider.js#L271
    // https://github.com/serverless/serverless-google-cloudfunctions/blob/master/provider/googleProvider.js#L25
    serverless.configSchemaHandler.defineProvider(constants.providerName, {})
  }

  getStage() {
    let stage = 'dev'
    if (this.options.stage) {
      stage = this.options.stage
    } else if (this.serverless.service.provider.stage) {
      stage = this.serverless.service.provider.stage
    }
    return stage
  }
}

module.exports = MicrostrateProvider
