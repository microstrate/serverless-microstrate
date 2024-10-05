'use strict'

const MicrostrateProvider = require('./lib/provider')
const MicrostrateDeploy = require('./lib/deploy')
const MicrostrateRemove = require('./lib/remove')
const MicrostrateMigrate = require('./lib/migrate')

class MicroStratePlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options

    this.serverless.pluginManager.addPlugin(MicrostrateProvider)
    this.serverless.pluginManager.addPlugin(MicrostrateDeploy)
    this.serverless.pluginManager.addPlugin(MicrostrateRemove)
    this.serverless.pluginManager.addPlugin(MicrostrateMigrate)
  }
}

module.exports = MicroStratePlugin
