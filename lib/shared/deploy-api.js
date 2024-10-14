'use strict'

const fetch = require('node-fetch')

// TODO
const BASE_URL = process.env.BASE_URL

/**
 * @typedef {object} DeployResourceOutpout
 * @property {string} status
 * @property {string[]} [errors]
 * @property {string[]} [warnings]
 * @property {string[]} [infos]
 *
 * @typedef {object} DeployStackOutpout
 * @property {'success' | 'failed'} status
 * @property {object} body
 * @property {string} body.message
 * @property {Object.<string, DeployResourceOutpout>} body.data
 */

/**
 * @param {import('../resources/types').Stack} stack
 * @returns {Promise<DeployStackOutpout>}
 */
const deployStack = stack =>
  fetch(`${BASE_URL}/deployments/stack`, {
    method: 'post',
    body: JSON.stringify({
      command: 'deploy-stack',
      body: { stack },
    }),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())

/**
 * @typedef {object} RemoveResourceOutpout
 * @property {string} status
 * @property {string[]} [errors]
 * @property {string[]} [warnings]
 * @property {string[]} [infos]
 *
 * @typedef {object} RemoveStackOutpout
 * @property {'success' | 'failed'} status
 * @property {object} body
 * @property {string} body.message
 * @property {Object.<string, RemoveResourceOutpout>} body.data
 */

/**
 * @param {object} stack
 * @param {string} stack.Name
 * @param {string} stack.Stage
 * @returns {Promise<RemoveStackOutpout>}
 */
const removeStack = stack =>
  fetch(`${BASE_URL}/deployments/stack`, {
    method: 'post',
    body: JSON.stringify({
      command: 'remove-stack',
      body: { stack },
    }),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())

module.exports = {
  deployStack,
  removeStack,
}
