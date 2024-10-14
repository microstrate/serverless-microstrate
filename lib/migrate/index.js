'use strict'

const fs = require('fs')
const path = require('path')
const { mapResourceMappings } = require('../resources')
const {
  ServerlessPlugin,
  constants,
  cleanObjEmptyProps,
  yamldump,
  cloneObj,
} = require('../shared')

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
      'migrate:run': () => this.migrateTemplate(this.serverless),
    }
  }

  displayAlternativeNotFoundWarning(tplKey) {
    this.logWarning(
      `Warning: Could not found compatible resource in ${constants.ProviderName} for resource '${tplKey}'.`,
    )
  }

  createConfigBackup(dir, file) {
    return fs.copyFileSync(
      path.join(dir, file),
      path.join(dir, `${file}-backup.${Date.now()}`),
    )
  }

  migrateTemplate(sls) {
    // create backup file first
    this.createConfigBackup(sls.serviceDir, sls.configurationFilename)

    const cloned = cloneObj(sls.configurationInput)

    cloned.provider.name = constants.ProviderName
    // delete extra prop
    if (cloned.package) {
      delete cloned.package.artifactsS3KeyDirname
    }
    // delete extra prop
    if (cloned.provider) {
      delete cloned.provider.versionFunctions
    }
    if (cloned.functions) {
      cloned.functions = mapResourceMappings(
        {}, // do not provide provider here to avoid dupe default values
        cloned.functions,
        {
          overrideType: constants.TplMicroStrateFunction,
          notFoundCb: this.displayAlternativeNotFoundWarning.bind(this),
        },
      ).reduce((acc, tpl) => Object.assign(acc, tpl.deploy()), {})
    }
    if (cloned.resources && cloned.resources.Resources) {
      cloned.resources.Resources = mapResourceMappings(
        cloned.provider,
        cloned.resources.Resources,
        { notFoundCb: this.displayAlternativeNotFoundWarning.bind(this) },
      ).reduce((acc, tpl) => Object.assign(acc, tpl.deploy()), {})
    }

    // output migrated config
    fs.writeFileSync(
      path.join(sls.serviceDir, sls.configurationFilename),
      yamldump(cleanObjEmptyProps(cloned)),
    )
  }
}

module.exports = MicrostrateMigrate
