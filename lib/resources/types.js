'use strict'

// dummy export for types be visible
module.exports = {}

/**
 * @typedef {object} Stack
 * @property {string} Name
 * @property {object.<string, any>} Resources
 */

/**
 * @callback TplResourceMappingFn
 * @param {string} key resource key from template
 * @param {object} config resource config from template
 * @param {MicroStrateProviderConfig} provider provider config from template
 * @returns {TplResourceMapping}
 */

/**
 * @typedef {object} TplResourceMapping
 * @property {function(): string} key resource key from template
 * @property {function(): string} template returns serverless resource template
 * @property {function(): string[]} validate returns validation failure messages
 * @property {function(): any} deploy returns deployment resource template
 * @property {boolean} [migrated] true if resource was migrated to microstrate resource
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
 * @typedef {object} MicroStrateFunctionEventsHttpCorsConfig
 * @property {string[]} origins
 *
 * @typedef {object} MicroStrateFunctionEventsHttpConfig
 * @property {object} http
 * @property {string} http.path
 * @property {string} http.method
 * @property {MicroStrateFunctionEventsHttpCorsConfig | boolean} http.cors
 * @property {object} httpApi
 * @property {string} httpApi.path
 * @property {string} httpApi.method
 * @property {MicroStrateFunctionEventsHttpCorsConfig | boolean} httpApi.cors
 *
 * @typedef {object} MicroStrateFunctionConfig
 * @property {string} handler
 * @property {string} [description]
 * @property {string} [runtime]
 * @property {string} [architecture]
 * @property {number} [memorySize]
 * @property {number} [timeout]
 * @property {object.<string, string>} [environment]
 * @property {MicroStrateFunctionEventsHttpConfig[]} [events]
 * @property {object} package
 * @property {string} package.artifact
 * @property {string} name
 */
