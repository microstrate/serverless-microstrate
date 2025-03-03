'use strict'

const fetch = require('node-fetch')

// TODO
const { API_URL } = process.env

/**
 * @typedef {object} DeployStackBody
 * @property {string} name
 * @property {string} stage
 * @property {Object.<string, any>} resources
 *
 * @typedef {object} DeployStackOutpout
 * @property {string} message
 * @property {import('../resources/types').Stack} data
 *
 * @param {DeployStackBody} body
 * @returns {Promise<DeployStackOutpout>}
 */
const deployStack = body =>
  callApi({ command: 'deploy-stack', body })
    .then(() => delay(2000))
    .then(() => getStack({ name: body.name, stage: body.stage }, true))

/**
 * @typedef {object} GetStackBody
 * @property {string} name
 * @property {string} stage
 *
 * @typedef {object} GetStackOutpout
 * @property {string} message
 * @property {import('../resources/types').Stack} data
 *
 * @param {GetStackBody} body
 * @param {boolean} poll
 * @returns {Promise<GetStackOutpout>}
 */
const getStack = (body, poll = true) => {
  const fetchStack = () => callApi({ command: 'get-stack', body })

  return poll
    ? [1, 2, 3].reduce(
        (chain, _) =>
          chain.then(acc =>
            acc && acc.data && acc.data.status !== 'IN_PROGRESS'
              ? Promise.resolve(acc)
              : delay(1000).then(() => fetchStack()),
          ),
        fetchStack(),
      )
    : fetchStack()
}

/**
 * @typedef {object} RemoveStackBody
 * @property {string} name
 * @property {string} stage
 *
 * @typedef {object} RemoveResourceOutpout
 * @property {'success'|'failed'} status
 * @property {string[]} [errors]
 * @property {string[]} [warnings]
 * @property {string[]} [infos]
 *
 * @typedef {object} RemoveStackOutpout
 * @property {string} message
 * @property {Object.<string, RemoveResourceOutpout>} data
 *
 * @param {RemoveStackBody} body
 * @returns {Promise<RemoveStackOutpout>}
 */
const removeStack = body => callApi({ command: 'remove-stack', body })

/**
 * @typedef {object} AttachStackResourcesBody
 * @property {string} name
 * @property {string} stage
 * @property {Object.<string, any>} resources
 *
 * @param {AttachStackResourcesBody} body
 * @returns {Promise<Object.<string, import('../resources/types').StackResourceResult>>}
 */
const attachResources = body =>
  callApi({ command: 'attach-resources', body })
    .then(() => delay(2000))
    .then(() => getStack({ name: body.name, stage: body.stage }, true))
    .then(res =>
      Object.keys(body.resources).reduce(
        (acc, resourceId) =>
          Object.assign(acc, { [resourceId]: res.data.resources[resourceId] }),
        {},
      ),
    )

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * @param {any} body
 */
const callApi = body => {
  if (process.env.DEBUG === 'TRUE') {
    console.log('callApi request', JSON.stringify(body))
  }

  return fetch(API_URL, {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(res => res.json())
    .then(res => {
      if (process.env.DEBUG === 'TRUE') {
        console.log('callApi response', JSON.stringify(res))
      }

      return res
    })
}

module.exports = {
  getStack,
  deployStack,
  removeStack,
  attachResources,
}
