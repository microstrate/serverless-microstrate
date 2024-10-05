'use strict'

const { ServerlessPlugin, constants } = require('../shared')

class MicrostrateMigrate extends ServerlessPlugin {
  constructor(serverless, options) {
    super(serverless, options)

    // https://www.serverless.com/framework/docs/guides/plugins/custom-commands
    this.commands = {
      migrate: {
        usage: `Migrate your serverless.yml to ${constants.ProviderName} compatible template`,
        lifecycleEvents: ['run'],
      },
    }

    this.hooks = {
      'migrate:run': () =>
        Promise.resolve().then(this.migrateTemplate.bind(this)),
    }
  }

  migrateTemplate() {
    // TODO
    return Promise.all([])
  }
}

module.exports = MicrostrateMigrate
