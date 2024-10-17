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

  // MicroStrate & GCP style
  if (tplResource.type) {
    return Resources[tplResource.type]
  }

  return null
}

/**
 * @param {import('./types').MicroStrateProviderConfig} provider
 * @param {object[]} tplResources
 * @param {object} [options]
 * @param {string} [options.overrideType]
 * @param {function(string, object): import('./types').TplResourceMapping | null} [options.notFoundCb]
 * @returns {import('./types').TplResourceMapping[]}
 */
const mapResourceMappings = (provider, tplResources, options) =>
  Object.entries(tplResources)
    .map(([tplKey, tplResource]) => {
      const targetResourceMapping = getResourceMapping(
        (options && options.overrideType) || tplResource,
      )
      const targetResource =
        targetResourceMapping &&
        targetResourceMapping(tplKey, tplResource, provider)
      if (!targetResource) {
        return options && options.notFoundCb
          ? options.notFoundCb(tplKey, tplResource)
          : null
      }

      return targetResource
    })
    .filter(r => !!r)

module.exports = {
  getResourceMapping,
  mapResourceMappings,
}
