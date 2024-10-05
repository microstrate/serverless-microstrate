'use strict'

const yaml = require('js-yaml')
const { constants, cloneObj, cleanObjEmptyProps } = require('../shared')

const getResourceTemplate = (key, config) =>
  yaml.dump(
    cleanObjEmptyProps({
      [key]: cloneObj(config),
    }),
    { noRefs: true },
  )

const MicroStrateResources = {
  [constants.TplMicroStrateKVBucket]: (key, config) => ({
    template: () => getResourceTemplate(key, config),
    deploy: () => {},
  }),
  [constants.TplMicroStrateObjectStoreBucket]: (key, config) => ({
    template: () => getResourceTemplate(key, config),
    deploy: () => {},
  }),
}

module.exports = {
  MicroStrateResources,
}
