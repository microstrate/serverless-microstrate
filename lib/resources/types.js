'use strict'

module.exports = {}

/**
 * @callback TplResourceMappingFn
 * @param {string} key
 * @param {object} config
 * @param {MicroStrateProviderConfig} provider
 * @returns {TplResourceMapping}
 */

/**
 * @typedef {object} TplResourceMapping
 * @property {function(): string} template
 * @property {function(): Promise<any>} deploy
 * @property {boolean} [migrated]
 */

/**
 * @typedef {object} MicroStrateProviderConfig
 * @property {string} name
 * @property {string} region
 * @property {string} runtime
 * @property {string} architecture
 * @property {string} stage
 * @property {number} memorySize
 * @property {number} timeout
 * @property {object.<string, string>} environment
 */

/**
 * @typedef {object} MicroStrateKVBucketConfig
 * @property {string} Type
 * @property {string} DeletionPolicy
 * @property {object} Properties
 * @property {string} Properties.BucketName
 * @property {string} Properties.Description
 * @property {object[]} Properties.Metadata
 * @property {string} Properties.Metadata[].Key
 * @property {string} Properties.Metadata[].Value
 */

/**
 * @typedef {object} MicroStrateObjectStoreBucketConfig
 * @property {string} Type
 * @property {string} DeletionPolicy
 * @property {object} Properties
 * @property {string} Properties.BucketName
 * @property {string} Properties.Description
 * @property {object[]} Properties.Metadata
 * @property {string} Properties.Metadata[].Key
 * @property {string} Properties.Metadata[].Value
 */

/**
 * @typedef {object} MicroStrateFunctionConfig
 * @property {string} handler
 * @property {string} description
 * @property {number} memorySize
 * @property {number} timeout
 * @property {object[]} [events]
 * @property {object} events[].http
 * @property {string} events[].http.path
 * @property {string} events[].http.method
 * @property {object} events[].http.cors
 * @property {string[]} events[].http.cors.origins
 * @property {object} package
 * @property {string} package.artifact
 * @property {string} name
 */
