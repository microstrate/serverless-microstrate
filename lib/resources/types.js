'use strict'

// dummy export for types be visible
module.exports = {}

/**
 * @typedef {object} StackResourceResult
 * @property {string} error
 * @property {"IN_PROGRESS"|"FAILED"|"SUCCESS"|"ATTACHED"|"DELETED"} status
 * @property {string} timestamp
 *
 * @typedef {object} Stack
 * @property {string} name
 * @property {string} stage
 * @property {string} description
 * @property {"IN_PROGRESS"|"FAILED"|"SUCCESS"|"ATTACHED"|"DELETED"} status
 * @property {Object.<string, any>} resources
 * @property {Object.<string, StackResourceResult>} [result]
 */

/**
 * @callback TplResourceMappingFn
 * @param {string} key resource key from template
 * @param {object} config resource config from template
 * @param {MicroStrateProvider} provider provider config from template
 * @returns {TplResourceMapping}
 */

/**
 * @typedef {object} TplResourceMapping
 * @property {function(): string} key resource key from template
 * @property {function(): string} type resource type from template
 * @property {function(): string} template returns serverless resource template
 * @property {function(): string[]} validate returns validation failed messages
 * @property {function(): MicroStrateResource} deploy returns deployment resource template
 * @property {boolean} [migrated] true if resource was migrated to microstrate resource
 */

/**
 * @typedef {object} MicroStrateResource
 * @property {string} type
 * @property {string} deletion_policy
 * @property {object} properties
 */

/**
 * @typedef {object} MicroStrateProvider
 * @property {string} name
 * @property {string} [region]
 * @property {string} [runtime]
 * @property {string} [architecture]
 * @property {string} stage
 * @property {number} [memory_size]
 * @property {string} [memory]
 * @property {number} [timeout]
 * @property {Object.<string, string>} environment
 */

/**
 * @typedef {object} MicroStrateKVBucket
 * @property {string} type
 * @property {string} deletion_policy
 * @property {object} properties
 * @property {string} properties.name
 * @property {string} [properties.description]
 * @property {Object.<string, string>} [properties.metadata]
 * @property {string} [properties.ttl]
 * @property {number} [properties.replicas]
 * @property {number} [properties.max_bytes]
 * @property {boolean} [properties.compression]
 * @property {"file"|"memory"} [properties.storage]
 * @property {object} [properties.indexing]
 * @property {number} [properties.indexing.partitions]
 * @property {object[]} [properties.indexing.mappings]
 * @property {string} [properties.indexing.mappings[].field]
 * @property {string} [properties.indexing.mappings[].field_type]
 */

/**
 * @typedef {object} MicroStrateObjectStoreBucket
 * @property {string} type
 * @property {string} deletion_policy
 * @property {object} properties
 * @property {string} properties.name
 * @property {string} [properties.description]
 * @property {Object.<string, string>} [properties.metadata]
 * @property {string} [properties.ttl]
 * @property {number} [properties.replicas]
 * @property {number} [properties.max_bytes]
 * @property {boolean} [properties.compression]
 * @property {"file"|"memory"} [properties.storage]
 */

/**
 * @typedef {object} FunctionAsset
 * @property {string} asset_name
 * @property {string} asset_type
 * @property {string} asset_value
 *
 * @typedef {object} FunctionLimit
 * @property {string} memory
 *
 * @typedef {object} FunctionComputeAsset
 * @property {FunctionAsset[]} assets
 * @property {string[]} [constraints]
 * @property {string[]} [env_vars]
 * @property {string} handler
 * @property {FunctionLimit} limits
 * @property {string} [runtime]
 * @property {string} [namespace]
 * @property {number} [occ]
 * @property {string[]} [secrets]
 * @property {number} [timeout]
 * @property {string} [service]
 *
 * @typedef {object} MicroStrateFunction
 * @property {string} type
 * @property {string} deletion_policy
 * @property {object} properties
 * @property {string} properties.name
 * @property {FunctionComputeAsset} properties.compute_asset
 *
 * @typedef {object} MicroStrateFunctionAsset
 * @property {string} type
 * @property {string} deletion_policy
 * @property {FunctionComputeAsset} properties
 */

/**
 * @typedef {object} StreamConsumerLimits
 * @property {number} inactive_threshold
 * @property {number} max_ack_pending
 *
 * @typedef {object} StreamSubjectTransform
 * @property {string} src
 * @property {string} dest
 *
 * @typedef {object} MicroStrateStream
 * @property {string} type
 * @property {string} deletion_policy
 * @property {object} properties
 * @property {string} properties.name
 * @property {string} [properties.description]
 * @property {Object.<string, string>} [properties.metadata]
 * @property {string[]} [properties.subjects]
 * @property {number} [properties.max_consumers]
 * @property {number} [properties.max_msgs]
 * @property {number} [properties.max_bytes]
 * @property {"file"|"memory"} [properties.storage]
 * @property {bool} [properties.discard_new_per_subject]
 * @property {number} [properties.max_msgs_per_subject]
 * @property {number} [properties.max_msg_size]
 * @property {number} [properties.num_replicas]
 * @property {bool} [properties.no_ack]
 * @property {bool} [properties.sealed]
 * @property {bool} [properties.deny_delete]
 * @property {bool} [properties.deny_purge]
 * @property {bool} [properties.allow_rollup_hdrs]
 * @property {number} [properties.first_seq]
 * @property {bool} [properties.allow_direct]
 * @property {StreamConsumerLimits} [properties.consumer_limits]
 * @property {number} [properties.max_age]
 * @property {number} [properties.duplicate_window]
 * @property {"limits"|"interest"|"workqueue"} [properties.retention]
 * @property {"none"|"s2"} [properties.compression]
 * @property {StreamSubjectTransform} [properties.subject_transform]
 */

/**
 * @typedef {object} GatewayLimit
 * @property {number} request
 * @property {number} time
 *
 * @typedef {object} GatewayMiddleware
 * @property {number} order
 * @property {string} [resource]
 * @property {string} [resource_type]
 * @property {string} [resource_version]
 * @property {string} [type]
 *
 * @typedef {object} MicroStrateGateway
 * @property {string} type
 * @property {string} deletion_policy
 * @property {object} properties
 * @property {string} properties.name
 * @property {string} [properties.description]
 * @property {Object.<string, string>} [properties.metadata]
 * @property {GatewayLimit} [properties.limit]
 * @property {GatewayMiddleware[]} [properties.middleware]
 * @property {bool} [properties.active]
 * @property {string} [properties.resource]
 * @property {string} [properties.resource_type]
 * @property {number} [properties.timeout]
 * @property {string} [properties.url]
 *
 * @typedef {object} MicroStrateGatewayMapping
 * @property {string} type
 * @property {string} deletion_policy
 * @property {object} properties
 * @property {string} properties.name
 * @property {string} properties.gateway
 * @property {string} properties.path
 * @property {bool} properties.is_public
 * @property {GatewayLimit} [properties.limit]
 * @property {string} [properties.method]
 * @property {number} [properties.timeout]
 * @property {Object.<number, number>} [properties.traffic_distribution]
 *
 * @typedef {object} MicroStrateGatewayMappingVersion
 * @property {string} type
 * @property {string} deletion_policy
 * @property {object} properties
 * @property {bool} [properties.active]
 * @property {string[]} [properties.attributes]
 * @property {string} [properties.boolean_logic]
 * @property {string} [properties.description]
 * @property {bool} [properties.exact_match]
 * @property {string} [properties.invocation_type]
 * @property {string} [properties.mapping] // subject of a gateway mapping
 * @property {GatewayMiddleware[]} [properties.middleware]
 * @property {string} [properties.resource] // subject of a fn
 * @property {string} [properties.resource_type] // function
 * @property {string} [properties.resource_version]
 * @property {string} [properties.subject]
 * @property {number} [properties.version]
 */

/**
 * @typedef {object} MicroStrateCollection
 * @property {string} name
 * @property {string} [description]
 */
