'use strict'

const ProviderName = 'microstrate'

const TplResourceSeparator = '::'
const TplResourceBrand = 'MicroStrate'
const TplMicroStrateKVBucket = `${TplResourceBrand}${TplResourceSeparator}KV${TplResourceSeparator}Bucket`
const TplMicroStrateObjectStoreBucket = `${TplResourceBrand}${TplResourceSeparator}ObjectStore${TplResourceSeparator}Bucket`

module.exports = {
  ProviderName,
  TplMicroStrateKVBucket,
  TplMicroStrateObjectStoreBucket,
}
