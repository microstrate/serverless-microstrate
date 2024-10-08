'use strict'

const ServerlessPlugin = require('./plugin')
const constants = require('./constants')
const deployAPI = require('./deploy-api')
const utils = require('./utils')

module.exports = {
  constants,
  ...utils,
  deployAPI,
  ServerlessPlugin,
}
