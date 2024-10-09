'use strict'

const { constants } = require('../shared')
const { MicroStrateResources } = require('./microstrate')

const AWSResourceMapping = {
  'AWS::Lambda::Function': (key, config, provider) => null,
  'AWS::DynamoDB::Table': (key, config, provider) => null,
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
    Type: constants.TplMicroStrateObjectStoreBucket,
    DeletionPolicy: config.DeletionPolicy,
    Properties: {
      BucketName: config.Properties && config.Properties.BucketName,
      Description: config.Properties && config.Properties.Description,
      Metadata: config.Properties && config.Properties.Tags,
    },
  }

  return result
}

module.exports = {
  AWSResourceMapping,
}
