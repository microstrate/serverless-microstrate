'use strict'

const chalk = require('chalk')
const { mergeObjects } = require('./utils')

const warningColor = chalk.rgb(255, 165, 0)
const infoColor = chalk.gray
const errorColor = chalk.redBright
const successColor = chalk.green

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
  }

  getStage() {
    return this.serverless.service.provider.stage
  }

  getProvider() {
    return this.serverless.service.provider
  }

  getServiceName() {
    return this.serverless.service.service
  }

  getFunctions() {
    return this.serverless.service.getAllFunctions().reduce(
      (acc, key) =>
        mergeObjects(acc, {
          [key]: this.serverless.service.getFunction(key),
        }),
      {},
    )
  }

  getResources() {
    return (
      (this.serverless.service.resources &&
        this.serverless.service.resources.Resources) ||
      {}
    )
  }

  getLayers() {
    return (
      (this.serverless.service.initialServerlessConfig &&
        this.serverless.service.initialServerlessConfig.layers) ||
      []
    )
  }

  getStage() {
    return this.options.stage || this.serverless.service.provider.stage || 'dev'
  }

  logWarning(message) {
    console.log(warningColor(message))
  }

  logError(message) {
    console.log(errorColor(message))
  }

  logInfo(message) {
    console.log(infoColor(message))
  }

  logSuccess(message) {
    console.log(successColor(message))
  }

  log(message) {
    this.serverless.cli.log(message)
  }
}

module.exports = ServerlessPlugin
