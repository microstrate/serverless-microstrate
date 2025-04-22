'use strict'

const fs = require('fs')
const { constants, parseNumber, mergeObjects } = require('../shared')
const { MicroStrateResources } = require('./microstrate')

const AWSResourceMapping = {
  'AWS::Lambda::Function': (key, config, provider) =>
    migrateResource(
      key,
      migrateLambdaToFunctionConfig(provider, config),
      provider,
      constants.TplMicroStrateFunction,
    ),
  'AWS::Lambda::Function::Asset': (key, config, provider) =>
    migrateResource(
      key,
      migrateLambdaToFunctionAssetConfig(provider, config),
      provider,
      constants.TplMicroStrateFunctionAsset,
    ),
  'AWS::DynamoDB::Table': (key, config, provider) =>
    migrateResource(
      key,
      migrateDynamoTableToKvConfig(provider, config),
      provider,
      constants.TplMicroStrateKVBucket,
    ),
  'AWS::S3::Bucket': (key, config, provider) =>
    migrateResource(
      key,
      migrateS3BucketConfigToObjectStoreConfig(provider, config),
      provider,
      constants.TplMicroStrateObjectStoreBucket,
    ),
  'AWS::Lambda::Http:Mapping': (key, config, provider) =>
    migrateResource(
      key,
      migrateLambdaToFunctionHttpConfig(provider, config),
      provider,
      constants.TplMicroStrateGatewayMapping,
    ),
}

const migrateResource = (key, config, provider, toResource) => {
  const resource = MicroStrateResources[toResource]
  if (!resource) {
    return null
  }

  return {
    migrated: true,
    ...resource(key, config, provider),
  }
}

/**
 * @returns {import('./types').MicroStrateObjectStoreBucketConfig}
 */
const migrateS3BucketConfigToObjectStoreConfig = (_provider, config) => ({
  type: constants.TplMicroStrateObjectStoreBucket,
  deletionPolicy: config.DeletionPolicy && config.DeletionPolicy.toLowerCase(),
  properties: {
    bucket: config.Properties && config.Properties.BucketName,
    description: config.Properties && config.Properties.Description,
    metadata:
      config.Properties &&
      config.Properties.Tags &&
      config.Properties.Tags.reduce(
        (acc, crt) =>
          mergeObjects(acc, {
            [crt.Key]: crt.Value,
          }),
        {},
      ),
  },
})

const migrateDynamoTableToKvConfig = (_provider, config) => {
  /**
   * map attributes into a map of attribute name as key and attribute type as value
   * for easy lookup
   * @type {Object.<string, string>}
   */
  const tableAttributes = (
    (config.Properties && config.Properties.AttributeDefinitions) ||
    []
  ).reduce(
    (acc, crt) => mergeObjects(acc, { [crt.AttributeName]: crt.AttributeType }),
    {},
  )
  /**
   * merge key schema and global secondary indexes as both becomes indexes in kv
   * @type {string[]}
   */
  const tableIndexes = [
    ...((config.Properties && config.Properties.KeySchema) || []),
    ...(
      (config.Properties && config.Properties.GlobalSecondaryIndexes) ||
      []
    ).reduce((acc, crt) => acc.concat(crt.KeySchema), []),
  ]
    .map(x => x.AttributeName)
    .filter((x, i, arr) => arr.indexOf(x) === i) // filter dupes

  const mapAttributeType = type => {
    if (!type) {
      return 'text'
    }

    switch (type.toLowerCase()) {
      case 's':
        return 'text'
      case 'n':
        return 'number'
      default:
        return 'text'
    }
  }

  /**
   * @type {import('./types').MicroStrateKVBucketConfig['indexing']}
   */
  const indexing = { mappings: [] }
  tableIndexes.map(field =>
    indexing.mappings.push({
      field,
      fieldType: mapAttributeType(tableAttributes[field]),
    }),
  )

  /**
   * @type {import('./types').MicroStrateKVBucketConfig}
   */
  return {
    type: constants.TplMicroStrateKVBucket,
    deletionPolicy:
      config.DeletionPolicy && config.DeletionPolicy.toLowerCase(),
    properties: {
      bucket: config.Properties && config.Properties.TableName,
      description: config.Properties && config.Properties.Description,
      metadata:
        config.Properties &&
        config.Properties.Tags &&
        config.Properties.Tags.reduce(
          (acc, crt) =>
            mergeObjects(acc, {
              [crt.Key]: crt.Value,
            }),
          {},
        ),
      indexing,
    },
  }
}

/**
 *
 * @param {string} runtime
 * @returns {string}
 */
const migrateRuntime = runtime =>
  runtime.startsWith('node') ? 'nodejs' : runtime

/**
 *
 * @param {string} runtime
 * @returns {boolean}
 */
const supportedRuntime = runtime => runtime.startsWith('nodejs')

/**
 * @returns {import('./types').MicroStrateFunction}
 */
const migrateLambdaToFunctionConfig = (provider, config) =>
  supportedRuntime(config.runtime || provider.runtime)
    ? {
        type: constants.TplMicroStrateFunction,
        properties: {
          name: config.name,
          compute_asset: {
            env_vars: Object.entries(
              mergeObjects(
                provider.environment,
                config.environment,
                config.env,
              ),
            ).reduce((acc, [key, value]) => acc.concat(`${key}=${value}`), []),
            handler: `/${config.handler}`,
            limits: {
              memory:
                (config.memorySize !== undefined &&
                  config.memorySize !== null) ||
                (provider.memorySize !== undefined &&
                  provider.memorySize !== null)
                  ? `${parseNumber(config.memorySize || provider.memorySize)}mb`
                  : config.memory || provider.memory,
            },
            runtime: migrateRuntime(config.runtime || provider.runtime),
            timeout:
              (parseNumber(config.timeout || provider.timeout) || 30) *
              1_000_000_000,
            assets: [],
          },
        },
      }
    : null

/**
 * @returns {import('./types').MicroStrateFunctionAsset}
 */
const migrateLambdaToFunctionAssetConfig = (provider, config) =>
  supportedRuntime(config.runtime || provider.runtime)
    ? {
        type: constants.TplMicroStrateFunctionAsset,
        properties: {
          env_vars: Object.entries(
            mergeObjects(provider.environment, config.environment, config.env),
          ).reduce((acc, [key, value]) => acc.concat(`${key}=${value}`), []),
          handler: `/${config.handler}`,
          limits: {
            memory:
              (config.memorySize !== undefined && config.memorySize !== null) ||
              (provider.memorySize !== undefined &&
                provider.memorySize !== null)
                ? `${parseNumber(config.memorySize || provider.memorySize)}mb`
                : config.memory || provider.memory,
          },
          runtime: migrateRuntime(config.runtime || provider.runtime),
          timeout:
            (parseNumber(config.timeout || provider.timeout) || 30) *
            1_000_000_000,
          assets: [
            {
              asset_name: '/',
              asset_type: 'archive',
              asset_value: fs
                .readFileSync(config.package.artifact)
                .toString('base64'),
            },
            ...(config.layers || []).map(layer => ({
              asset_name: layer.path.replace('./', '/'),
              asset_type: 'archive',
              asset_value: fs
                .readFileSync(layer.package.artifact)
                .toString('base64'),
            })),
          ],
        },
      }
    : null

/**
 * @returns {import('./types').MicroStrateGatewayMapping}
 */
const migrateLambdaToFunctionHttpConfig = (_provider, config) => {
  if (config.gateway) {
    return {
      type: constants.TplMicroStrateGatewayMapping,
      properties: { ...config.gateway },
    }
  }

  if (!config.event) {
    return null
  }

  if (config.event.http) {
    return {
      type: constants.TplMicroStrateGatewayMapping,
      properties: {
        path: config.event.http.path,
        method: config.event.http.method,
        trafficDistribution: {
          1: 100,
        },
      },
    }
  }

  if (config.event.httpApi) {
    let method, path
    if (typeof config.event.httpApi === 'object') {
      ;({ method, path } = config.event.httpApi)
    } else if (typeof config.event.httpApi === 'string') {
      ;[method, path] = config.event.httpApi.split(' ').filter(x => !!x)
    }

    if (method && path) {
      return {
        type: constants.TplMicroStrateGatewayMapping,
        properties: {
          path,
          method,
          trafficDistribution: {
            1: 100,
          },
        },
      }
    }
  }

  return null
}

module.exports = {
  AWSResourceMapping,
}
