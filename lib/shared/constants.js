'use strict'

const ProviderName = 'microstrate'
const Separator = '::'
const Brand = 'microstrate'

const TplMicroStrateKVBucket = `${Brand}${Separator}kv${Separator}bucket`
const TplMicroStrateObjectStoreBucket = `${Brand}${Separator}objectstore${Separator}bucket`
const TplMicroStrateFunction = `${Brand}${Separator}function`
const TplMicroStrateGateway = `${Brand}${Separator}gateway`
const TplMicroStrateGatewayMapping = `${Brand}${Separator}gateway${Separator}mapping`
const TplMicroStrateGatewayMappingVersion = `${Brand}${Separator}gateway${Separator}mapping${Separator}version`
const TplMicroStrateStream = `${Brand}${Separator}stream`
const TplMicroStrateCollection = `${Brand}${Separator}collection`

module.exports = {
  ProviderName,
  TplMicroStrateKVBucket,
  TplMicroStrateObjectStoreBucket,
  TplMicroStrateFunction,
  TplMicroStrateGateway,
  TplMicroStrateGatewayMapping,
  TplMicroStrateGatewayMappingVersion,
  TplMicroStrateStream,
  TplMicroStrateCollection,
}
