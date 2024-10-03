'use strict'

class MicrostrateRemove {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options

    this.hooks = {
      'remove:remove': () =>
        Promise.resolve().then(this.removeFunctions.bind(this)),
    }
  }

  removeFunctions() {
    return Promise.all(
      this.serverless.service.getAllFunctions().map(functionName => {
        /*
          {
            handler: 'handler.hello',
            description: 'hello world desc',
            memorySize: 128,
            timeout: 3,
            events: [],
            name: 'hello-world-prod-hello',
            package: {
              artifact: '/home/nika/Projects/evari/serverless-microstrate/example/.serverless/hello.zip'
            }
          }
        */
        const func = this.serverless.service.getFunction(functionName)
        console.log(func)
        return Promise.resolve()
      }),
    )
  }
}

module.exports = MicrostrateRemove
