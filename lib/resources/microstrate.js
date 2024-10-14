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
    deploy: () => cleanResourceTemplate(key, config),
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
        Properties: {
          ...(config.Properties || {}),
          TTL: parseNumber(config.Properties && config.Properties.TTL),
          Replicas: parseNumber(
            config.Properties && config.Properties.Replicas,
          ),
          MaxBytes: parseNumber(
            config.Properties && config.Properties.MaxBytes,
          ),
          Compression: parseBoolean(
            config.Properties && config.Properties.Compression,
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
        Type: constants.TplMicroStrateFunction,
        Properties: {
          FunctionName: name,
          Description: config.description,
          Handler: config.handler,
          MemorySize: parseNumber(config.memorySize || provider.memorySize),
          Timeout: parseNumber(config.timeout || provider.timeout),
          Runtime: config.runtime || provider.runtime,
          Architecture: config.architecture || provider.architecture,
          Environment: Object.assign(
            {},
            provider.environment,
            config.environment,
          ),
          Events: (config.events || [])
            .map(ev =>
              ev.http
                ? {
                    Type: 'HTTP',
                    Path: ev.http.path,
                    Method: ev.http.method,
                    Cors:
                      ev.http.cors === true ? { Origins: ['*'] } : ev.http.cors,
                  }
                : ev.httpApi
                  ? {
                      Type: 'HTTP',
                      Path: ev.httpApi.path,
                      Method: ev.httpApi.method,
                      Cors:
                        ev.httpApi.cors === true
                          ? { Origins: ['*'] }
                          : ev.httpApi.cors,
                    }
                  : null,
            )
            .filter(ev => !!ev),
        },
        Assets: [
          pkg && pkg.artifact,
          // TODO layer
        ],
      }),
  }),
}

module.exports = {
  MicroStrateResources,
}
