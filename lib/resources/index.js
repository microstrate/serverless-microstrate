'use strict'

const { AWSResourceMapping } = require('./aws')
const { MicroStrateResources } = require('./microstrate')

const Resources = {
  ...AWSResourceMapping,
  ...MicroStrateResources,
}

const getResourceMapping = tplResource => {
  if (!tplResource) {
    return null
  }

  // AWS style
  if (tplResource.Type) {
    return Resources[tplResource.Type]
  }

  // GCP style
  if (tplResource.type) {
    return Resources[tplResource.type]
  }

  return null
}

module.exports = {
  getResourceMapping,
}
