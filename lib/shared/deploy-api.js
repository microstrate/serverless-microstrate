'use strict'

const fetch = require('node-fetch')

const BASE_URL = ''

/**
 * @typedef {object} DeployStackResponse
 * @property {string} status
 * @property {object} body
 */

/**
 *
 * @param {import('../resources/types').Stack} stack
 * @returns {Promise<DeployStackResponse>}
 */
const deployStack = stack =>
  fetch(`${BASE_URL}/deploy`, {
    method: 'post',
    body: JSON.stringify({
      command: 'deploy-stack',
      body: { stack },
    }),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())

module.exports = {
  deployStack,
}
