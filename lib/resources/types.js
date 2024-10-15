'use strict'

// dummy export for types be visible
module.exports = {}

/**
 * @typedef {object} Stack
 * @property {string} name
 * @property {string} stage
 * @property {Object.<string, any>} resources
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
 * @property {function(): string[]} validate returns validation failed messages
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
 * @property {Object.<string, string>} environment
 */

/**
 * @typedef {object} MicroStrateKVBucketConfig
 * @property {string} type
 * @property {string} deletionPolicy
 * @property {object} properties
 * @property {string} properties.name
 * @property {string} properties.description
 * @property {object[]} properties.metadata
 * @property {string} properties.metadata[].key
 * @property {string} properties.metadata[].value
 * @property {string} [properties.ttl]
 * @property {number} [properties.replicas]
 * @property {number} [properties.maxBytes]
 * @property {boolean} [properties.compression]
 * @property {string} [properties.storage]
 * @property {object} [properties.indexing]
 * @property {number} [properties.indexing.partitions]
 * @property {object[]} [properties.indexing.mappings]
 * @property {string} [properties.indexing.mappings[].field]
 * @property {string} [properties.indexing.mappings[].fieldType]
 */

/**
 * @typedef {object} MicroStrateObjectStoreBucketConfig
 * @property {string} type
 * @property {string} deletionPolicy
 * @property {object} properties
 * @property {string} properties.name
 * @property {string} properties.description
 * @property {object[]} properties.metadata
 * @property {string} properties.metadata[].key
 * @property {string} properties.metadata[].value
 * @property {string} [ttl]
 * @property {number} [replicas]
 * @property {number} [maxBytes]
 * @property {boolean} [compression]
 * @property {string} [storage]
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
 * @property {Object.<string, string>} [environment]
 * @property {MicroStrateFunctionEventsHttpConfig[]} [events]
 * @property {object} package
 * @property {string} package.artifact
 * @property {string} name
 */
