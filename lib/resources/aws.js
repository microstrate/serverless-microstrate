'use strict'

const { constants, parseNumber } = require('../shared')
const { MicroStrateResources } = require('./microstrate')

const AWSResourceMapping = {
  'AWS::Lambda::Function': (key, config, provider) =>
    migrateResource(
      key,
      migrateLambdaToFunctionConfig(provider, config),
      provider,
      constants.TplMicroStrateFunction,
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
    name: config.Properties && config.Properties.BucketName,
    description: config.Properties && config.Properties.Description,
    metadata:
      config.Properties &&
      config.Properties.Tags &&
      config.Properties.Tags.reduce(
        (acc, crt) =>
          Object.assign(acc, {
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
    (acc, crt) =>
      Object.assign(acc, { [crt.AttributeName]: crt.AttributeType }),
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
      name: config.Properties && config.Properties.TableName,
      description: config.Properties && config.Properties.Description,
      metadata:
        config.Properties &&
        config.Properties.Tags &&
        config.Properties.Tags.reduce(
          (acc, crt) =>
            Object.assign(acc, {
              [crt.Key]: crt.Value,
            }),
          {},
        ),
      indexing,
    },
  }
}

/**
 * @returns {import('./types').MicroStrateFunctionConfig}
 */
const migrateLambdaToFunctionConfig = (provider, config) => ({
  type: constants.TplMicroStrateFunction,
  properties: {
    name: config.name,
    namespace: config.service,
    memory:
      (config.memorySize !== undefined && config.memorySize !== null) ||
      (provider.memorySize !== undefined && provider.memorySize !== null)
        ? `${parseNumber(config.memorySize || provider.memorySize)}mb`
        : config.memory || provider.memory,
    timeout: parseNumber(config.timeout || provider.timeout),
    // TODO missing props
    language: config.runtime || provider.runtime,
    workload_type: config.architecture || provider.architecture,
    env: Object.assign(
      {},
      provider.environment,
      config.environment,
      config.env,
    ),
    tags: config.metadata || config.tags,
  },
  assets: [
    config.package && config.package.artifact,
    // TODO layer
  ],
})

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
        },
      }
    }
  }

  return null
}

module.exports = {
  AWSResourceMapping,
}
