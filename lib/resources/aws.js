'use strict'

const { constants } = require('../shared')
const { MicroStrateResources } = require('./microstrate')

const migrateResource = (key, config, toResource) => {
  const resource = MicroStrateResources[toResource]
  if (!resource) {
    return null
  }

  return {
    migrated: true,
    ...resource(key, config),
  }
}

const migrateS3BucketConfigToObjectStoreConfig = config => {
  const result = {
    Type: constants.TplMicroStrateObjectStoreBucket,
    DeletionPolicy: config.DeletionPolicy,
    Properties: {
      BucketName:
        (config.Properties && config.Properties.BucketName) || undefined,
      Description:
        (config.Properties && config.Properties.Description) || undefined,
      Metadata: (config.Properties && config.Properties.Tags) || undefined,
    },
  }

  return result
}

const AWSResourceMapping = {
  'AWS::Lambda::Function': (key, config) => null,
  'AWS::DynamoDB::Table': (key, config) => null,
  'AWS::S3::Bucket': (key, config) =>
    migrateResource(
      key,
      migrateS3BucketConfigToObjectStoreConfig(config),
      constants.TplMicroStrateObjectStoreBucket,
    ),
}

module.exports = {
  AWSResourceMapping,
}
