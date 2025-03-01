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
   * @param {import('./types').TplFunction} config
   * @param {import('./types').MicroStrateProvider} provider
   * @returns {import('./types').TplResourceMapping}
   */
  [constants.TplMicroStrateFunction]: (
    key,
    { package: pkg, name, ...config } = {},
    provider,
  ) => ({
    key: () => key,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        type: constants.TplMicroStrateFunction,
        properties: {
          name,
          memory:
            (config.memorySize !== undefined && config.memorySize !== null) ||
            (provider.memorySize !== undefined && provider.memorySize !== null)
              ? `${parseNumber(config.memorySize || provider.memorySize)}mb`
              : config.memory || provider.memory,
          timeout: parseNumber(config.timeout || provider.timeout),
          // TODO missing props
          language: config.runtime || provider.runtime,
          architecture: config.architecture || provider.architecture,
          env: Object.assign(
            {},
            provider.environment,
            config.environment,
            config.env,
          ),
          tags: config.metadata || config.tags,
        },
        assets: [
          pkg && pkg.artifact,
          // TODO layer
        ],
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
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        type: constants.TplMicroStrateGateway,
        ...config,
      }),
  }),
}

module.exports = {
  MicroStrateResources,
}
