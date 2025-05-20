'use strict'

const fs = require('fs')
const os = require('os')
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

    // fixes layers compile
    // in "class Service" there is a condition "this.provider.name === 'aws'"
    if (!this.serverless.service.layers) {
      this.serverless.service.layers =
        this.serverless.service.initialServerlessConfig.layers
    }
  }

  getApiUrl() {
    return process.env.MICROSTRATE_URL || 'https://api.staging.microstrate.io'
  }

  getApiKey() {
    let { credentials } = this.getProvider()
    if (!credentials) {
      throw new Error('microstrate credentials not found')
    }

    return credentials
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
    return (this.serverless.service && this.serverless.service.layers) || {}
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
