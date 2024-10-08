'use strict'

const fetch = require('node-fetch')

const BASE_URL = ''

/**
 * @typedef {object} DeployResourceOutpout
 * @property {string[]} [errors]
 * @property {string[]} [warnings]
 * @property {string[]} [infos]
 *
 * @typedef {object} DeployStackOutpout
 * @property {'success' | 'failure'} status
 * @property {object} body
 * @property {string} body.message
 * @property {Object.<string, DeployResourceOutpout>} body.data
 */

/**
 *
 * @param {import('../resources/types').Stack} stack
 * @returns {Promise<DeployStackOutpout>}
 */
const deployStack = stack =>
  fetch(`${BASE_URL}/deploy/stack`, {
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
