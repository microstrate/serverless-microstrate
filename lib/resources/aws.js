'use strict'

const { constants } = require('../shared')
const { MicroStrateResources } = require('./microstrate')

const AWSResourceMapping = {
  'AWS::Lambda::Function': (key, config, provider) => null,
  'AWS::DynamoDB::Table': (key, config, provider) =>
    migrateResource(
      key,
      migrateDynamoTableToKvConfig(config),
      provider,
      constants.TplMicroStrateKVBucket,
    ),
  'AWS::S3::Bucket': (key, config, provider) =>
    migrateResource(
      key,
      migrateS3BucketConfigToObjectStoreConfig(config),
      provider,
      constants.TplMicroStrateObjectStoreBucket,
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

const migrateS3BucketConfigToObjectStoreConfig = config => {
  /**
   * @type {import('./types').MicroStrateObjectStoreBucketConfig}
   */
  const result = {
    type: constants.TplMicroStrateObjectStoreBucket,
    deletionPolicy:
      config.DeletionPolicy && config.DeletionPolicy.toLowerCase(),
    properties: {
      name: config.Properties && config.Properties.BucketName,
      description: config.Properties && config.Properties.Description,
      metadata:
        config.Properties &&
        config.Properties.Tags &&
        config.Properties.Tags.map(x => ({
          key: x.Key,
          value: x.Value,
        })),
    },
  }

  return result
}

const migrateDynamoTableToKvConfig = config => {
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
  const result = {
    type: constants.TplMicroStrateKVBucket,
    deletionPolicy:
      config.DeletionPolicy && config.DeletionPolicy.toLowerCase(),
    properties: {
      name: config.Properties && config.Properties.TableName,
      description: config.Properties && config.Properties.Description,
      metadata:
        config.Properties &&
        config.Properties.Tags &&
        config.Properties.Tags.map(x => ({
          key: x.Key,
          value: x.Value,
        })),
      indexing,
    },
  }

  return result
}

module.exports = {
  AWSResourceMapping,
}
