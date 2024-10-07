'use strict'

const yaml = require('js-yaml')
const { constants, cloneObj, cleanObjEmptyProps } = require('../shared')

const getResourceTemplate = (key, config) =>
  yaml.dump(cleanObjEmptyProps({ [key]: cloneObj(config) }), { noRefs: true })

const MicroStrateResources = {
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateKVBucketConfig} config
   * @param {import('./types').MicroStrateProviderConfig} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateKVBucket]: (key, config, provider) => ({
    template: () => getResourceTemplate(key, config),
    deploy: () => {},
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateObjectStoreBucketConfig} config
   * @param {import('./types').MicroStrateProviderConfig} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateObjectStoreBucket]: (key, config, provider) => ({
    template: () => getResourceTemplate(key, config),
    deploy: () => {},
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateFunctionConfig} config
   * @param {import('./types').MicroStrateProviderConfig} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateFunction]: (
    key,
    { package: pkg, name, ...config } = {},
    provider,
  ) => ({
    template: () => getResourceTemplate(key, config),
    deploy: () => {},
  }),
}

module.exports = {
  MicroStrateResources,
}
