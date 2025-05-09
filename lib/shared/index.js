'use strict'

const ServerlessPlugin = require('./plugin')
const constants = require('./constants')
const deployAPI = require('./deploy-api')
const parsers = require('./parsers')
const utils = require('./utils')

module.exports = {
  constants,
  ...parsers,
  ...utils,
  ...deployAPI,
  ServerlessPlugin,
}
