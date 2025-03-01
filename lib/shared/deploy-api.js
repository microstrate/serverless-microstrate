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
const deployStack = stack => {
  console.log('deploy', JSON.stringify(stack, null, 2))
  // TODO uncomment
  return Promise.resolve({
    status: 'success',
    body: {},
  })

  // TODO poll for results after making request

  fetch(`${BASE_URL}/deployments/stack`, {
    method: 'post',
    body: JSON.stringify({
      command: 'deploy-stack',
      body: { stack },
    }),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())
}

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
 * @param {string} stack.name
 * @param {string} stack.stage
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

/**
 * @param {string} stackName
 * @param {string} stackStage
 * @param {Object.<string, any>} resources
 * @returns {Promise<Object.<string, any>>}
 */
const attachResources = (stackName, stackStage, resources) =>
  fetch(`${BASE_URL}/deployments/stack`, {
    method: 'post',
    body: JSON.stringify({
      command: 'attach-resources',
      body: { name: stackName, stage: stackStage, resources },
    }),
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())

/**
 * @param {string} stackName
 * @param {string} stackStage
 * @param {string} resourceId
 * @returns {Promise<boolean>}
 */
const pollForResourceStatus = async (stackName, stackStage, resourceId) => {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`${BASE_URL}/deployments/stack`, {
      method: 'post',
      body: JSON.stringify({
        command: 'get-stack-resource',
        body: { name: stackName, stage: stackStage, resourceId },
      }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json())

    if (res && res.data && res.data.result && res.data.result[resourceId]) {
      if (
        ['SUCCESS', 'ATTACHED'].includes(res.data.result[resourceId].status)
      ) {
        return true
      } else {
        return false
      }
    }

    await new Promise(resolve => setTimeout(500, resolve))
  }

  return false
}

module.exports = {
  deployStack,
  removeStack,
  attachResources,
  pollForResourceStatus,
}
