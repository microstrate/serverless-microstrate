'use strict'

const { AWSResourceMapping } = require('./aws')
const { MicroStrateResources } = require('./microstrate')

const Resources = {
  ...AWSResourceMapping,
  ...MicroStrateResources,
}

/**
 *
 * @param {object | string} tplResource
 * @returns {import('./types').TplResourceMappingFn | null}
 */
const getResourceMapping = tplResource => {
  if (!tplResource) {
    return null
  }

  if (typeof tplResource === 'string') {
    return Resources[tplResource]
  }

  // AWS style
  if (tplResource.Type) {
    return Resources[tplResource.Type]
  }

  return null
}

module.exports = {
  getResourceMapping,
}
