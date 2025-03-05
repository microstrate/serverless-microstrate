'use strict'

const {
  constants,
  cloneObj,
  cleanObjEmptyProps,
  parseNumber,
  parseBoolean,
  yamldump,
} = require('../shared')

const getResourceTemplate = yamldump

const cleanResourceTemplate = (key, config) =>
  cleanObjEmptyProps({ [key]: cloneObj(config) })

const MicroStrateResources = {
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateKVBucket} config
   * @param {import('./types').MicroStrateProvider} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateKVBucket]: (key, config, _provider) => ({
    key: () => key,
    type: () => constants.TplMicroStrateKVBucket,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        ...config,
        properties: {
          ...(config.properties || {}),
          ttl: parseNumber(config.properties && config.properties.ttl),
          replicas: parseNumber(
            config.properties && config.properties.replicas,
          ),
          maxBytes: parseNumber(
            config.properties && config.properties.maxBytes,
          ),
          compression: parseBoolean(
            config.properties && config.properties.compression,
          ),
          indexing: config.properties.indexing && {
            ...config.properties.indexing,
            partitions: parseNumber(config.properties.indexing.partitions),
          },
          storage:
            config.properties.storage === 'file'
              ? 0
              : config.properties.storage === 'memory'
                ? 1
                : undefined,
        },
      }),
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateObjectStoreBucket} config
   * @param {import('./types').MicroStrateProvider} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateObjectStoreBucket]: (key, config, _provider) => ({
    key: () => key,
    type: () => constants.TplMicroStrateObjectStoreBucket,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        ...config,
        properties: {
          ...(config.properties || {}),
          ttl: parseNumber(config.properties && config.properties.ttl),
          replicas: parseNumber(
            config.properties && config.properties.replicas,
          ),
          maxBytes: parseNumber(
            config.properties && config.properties.maxBytes,
          ),
          compression: parseBoolean(
            config.properties && config.properties.compression,
          ),
          storage:
            config.properties.storage === 'file'
              ? 0
              : config.properties.storage === 'memory'
                ? 1
                : undefined,
        },
      }),
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateFunctionConfig} config
   * @param {import('./types').MicroStrateProvider} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateFunction]: (
    key,
    { type: _, ...config } = {},
    _provider,
  ) => ({
    key: () => key,
    type: () => constants.TplMicroStrateFunction,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        type: constants.TplMicroStrateFunction,
        ...config,
      }),
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateStream} config
   * @param {import('./types').MicroStrateProvider} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateStream]: (
    key,
    { type: _, ...config } = {},
    _provider,
  ) => ({
    key: () => key,
    type: () => constants.TplMicroStrateStream,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        type: constants.TplMicroStrateStream,
        ...config,
      }),
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateGateway} config
   * @param {import('./types').MicroStrateProvider} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateGateway]: (
    key,
    { type: _, ...config } = {},
    _provider,
  ) => ({
    key: () => key,
    type: () => constants.TplMicroStrateGateway,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        type: constants.TplMicroStrateGateway,
        ...config,
      }),
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateGatewayMapping} config
   * @param {import('./types').MicroStrateProvider} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateGatewayMapping]: (
    key,
    { type: _, ...config } = {},
    _provider,
  ) => ({
    key: () => key,
    type: () => constants.TplMicroStrateGatewayMapping,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        type: constants.TplMicroStrateGatewayMapping,
        ...config,
      }),
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateCollection} config
   * @param {import('./types').MicroStrateProvider} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateCollection]: (
    key,
    { type: _, ...config } = {},
    _provider,
  ) => ({
    key: () => key,
    type: () => constants.TplMicroStrateCollection,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        type: constants.TplMicroStrateCollection,
        ...config,
      }),
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateFunctionAsset} config
   * @param {import('./types').MicroStrateProvider} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateFunctionAsset]: (
    key,
    { type: _, ...config } = {},
    _provider,
  ) => ({
    key: () => key,
    type: () => constants.TplMicroStrateFunctionAsset,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        type: constants.TplMicroStrateFunctionAsset,
        ...config,
      }),
  }),
}

module.exports = {
  MicroStrateResources,
}
