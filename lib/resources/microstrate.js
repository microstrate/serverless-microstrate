'use strict'

const yaml = require('js-yaml')
const { constants, cloneObj, cleanObjEmptyProps } = require('../shared')

const getResourceTemplate = (key, config) =>
  yaml.dump(cleanObjEmptyProps({ [key]: cloneObj(config) }), { noRefs: true })

const MicroStrateResources = {
  /**
   * @typedef {Object} MicroStrateKVBucketConfig
   * @property {string} Type
   * @property {string} DeletionPolicy
   * @property {object} Properties
   * @property {string} Properties.BucketName
   * @property {string} Properties.Description
   * @property {object[]} Properties.Metadata
   * @property {string} Properties.Metadata[].Key
   * @property {string} Properties.Metadata[].Value
   *
   * @param {string} key
   * @param {MicroStrateKVBucketConfig} config
   * @returns {any}
   */
  [constants.TplMicroStrateKVBucket]: (key, config) => ({
    template: () => getResourceTemplate(key, config),
    deploy: () => {},
  }),
  /**
   * @typedef {Object} MicroStrateObjectStoreBucketConfig
   * @property {string} Type
   * @property {string} DeletionPolicy
   * @property {object} Properties
   * @property {string} Properties.BucketName
   * @property {string} Properties.Description
   * @property {object[]} Properties.Metadata
   * @property {string} Properties.Metadata[].Key
   * @property {string} Properties.Metadata[].Value
   *
   * @param {string} key
   * @param {MicroStrateObjectStoreBucketConfig} config
   * @returns {any}
   */
  [constants.TplMicroStrateObjectStoreBucket]: (key, config) => ({
    template: () => getResourceTemplate(key, config),
    deploy: () => {},
  }),
}

module.exports = {
  MicroStrateResources,
}
