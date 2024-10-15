'use strict'

const ProviderName = 'microstrate'

const TplResourceSeparator = '::'
const TplResourceBrand = 'microstrate'
const TplMicroStrateKVBucket = `${TplResourceBrand}${TplResourceSeparator}kv${TplResourceSeparator}bucket`
const TplMicroStrateObjectStoreBucket = `${TplResourceBrand}${TplResourceSeparator}objectstore${TplResourceSeparator}bucket`
const TplMicroStrateFunction = `${TplResourceBrand}${TplResourceSeparator}function`

module.exports = {
  ProviderName,
  TplMicroStrateKVBucket,
  TplMicroStrateObjectStoreBucket,
  TplMicroStrateFunction,
}
