'use strict'

const chalk = require('chalk')

const warningColor = chalk.rgb(255, 165, 0)
const infoColor = chalk.gray
const errorColor = chalk.redBright

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
  }

  getFunctions() {
    return this.serverless.service.getAllFunctions().reduce(
      (acc, key) =>
        Object.assign(acc, {
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

  log(message) {
    this.serverless.cli.log(message)
  }
}

module.exports = ServerlessPlugin
