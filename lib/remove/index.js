'use strict'

const { ServerlessPlugin } = require('../shared')

class MicrostrateRemove extends ServerlessPlugin {
  constructor(serverless, options) {
    super(serverless, options)

    this.hooks = {
      'remove:remove': () =>
        Promise.resolve().then(this.removeFunctions.bind(this)),
    }
  }

  removeFunctions() {
    // TODO
    return Promise.all(
      Object.entries(this.getFunctions()).map(([tplKey, tplResource]) => {
        return Promise.resolve()
      }),
    )
  }
}

module.exports = MicrostrateRemove
