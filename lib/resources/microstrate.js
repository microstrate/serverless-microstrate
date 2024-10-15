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
   * @param {import('./types').MicroStrateKVBucketConfig} config
   * @param {import('./types').MicroStrateProviderConfig} provider
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
        },
      }),
  }),
  /**
   * @param {string} key
   * @param {import('./types').MicroStrateObjectStoreBucketConfig} config
   * @param {import('./types').MicroStrateProviderConfig} provider
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
        },
      }),
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
    key: () => key,
    template: () => getResourceTemplate(cleanResourceTemplate(key, config)),
    validate: () => [],
    deploy: () =>
      cleanResourceTemplate(key, {
        type: constants.TplMicroStrateFunction,
        properties: {
          ...config,
          memorySize: parseNumber(config.memorySize || provider.memorySize),
          timeout: parseNumber(config.timeout || provider.timeout),
          runtime: config.runtime || provider.runtime,
          architecture: config.architecture || provider.architecture,
          environment: Object.assign(
            {},
            provider.environment,
            config.environment,
          ),
          events: (config.events || [])
            .map(ev =>
              ev.http
                ? {
                    type: 'HTTP',
                    path: ev.http.path,
                    method: ev.http.method,
                    cors:
                      ev.http.cors === true ? { origins: ['*'] } : ev.http.cors,
                  }
                : ev.httpApi
                  ? {
                      type: 'HTTP',
                      path: ev.httpApi.path,
                      method: ev.httpApi.method,
                      cors:
                        ev.httpApi.cors === true
                          ? { origins: ['*'] }
                          : ev.httpApi.cors,
                    }
                  : null,
            )
            .filter(ev => !!ev),
        },
        assets: [
          pkg && pkg.artifact,
          // TODO layer
        ],
      }),
  }),
}

module.exports = {
  MicroStrateResources,
}
