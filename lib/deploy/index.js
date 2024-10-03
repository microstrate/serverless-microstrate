'use strict'

class MicrostrateDeploy {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options

    this.hooks = {
      'deploy:deploy': () =>
        Promise.resolve()
          .then(this.deployResources.bind(this))
          .then(this.deployFunctions.bind(this)),
    }
  }

  deployFunctions() {
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

  deployResources() {
    if (
      !this.serverless.service.resources ||
      !this.serverless.service.resources.Resources
    ) {
      return Promise.resolve()
    }

    return Promise.all(
      Object.keys(this.serverless.service.resources.Resources).map(
        resourceName => {
          console.log(this.serverless.service.resources.Resources[resourceName])

          return Promise.resolve()
        },
      ),
    )
  }
}

module.exports = MicrostrateDeploy
