'use strict'

const fetch = require('node-fetch')
const { mergeObjects } = require('./utils')

// TODO
const { API_URL, API_ACCESS_TOKEN } = process.env

/**
 * @param {...DeployStackOutpout} stacks
 * @returns {boolean}
 */
const isSuccessful = (...stacks) =>
  stacks.reduce(
    (acc, crt) =>
      acc &&
      crt &&
      crt.data &&
      crt.data.result &&
      Object.values(crt.data.result).every(r => r.status === 'SUCCESS'),
    true,
  )

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
    .then(() =>
      getStack(
        { name: body.name, stage: body.stage },
        Object.keys(body.resources),
      ),
    )

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
 * @param {boolean|string[]} poll
 * @returns {Promise<GetStackOutpout>}
 */
const getStack = (body, poll = true) => {
  /**
   * @returns {import('../resources/types').Stack}
   */
  const fetchStack = () =>
    callApi({ command: 'get-stack', body }).then(r =>
      typeof poll === 'boolean' ? r : pickDeployedResourcesOnly(r, poll),
    )

  return poll
    ? [1, 2, 3].reduce(
        (chain, _) =>
          chain.then(acc =>
            acc &&
            acc.data &&
            !Object.values(acc.data.resources).some(
              r => r.status === 'IN_PROGRESS',
            )
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
 * @returns {Promise<GetStackOutpout>}
 */
const attachResources = body =>
  callApi({ command: 'attach-resources', body })
    .then(() => delay(2000))
    .then(() =>
      getStack(
        { name: body.name, stage: body.stage },
        Object.keys(body.resources),
      ),
    )
    .then(res =>
      mergeObjects(res, {
        resources: Object.keys(body.resources).reduce(
          (acc, resourceId) =>
            mergeObjects(acc, {
              [resourceId]: res.data.resources[resourceId],
            }),
          {},
        ),
      }),
    )

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * @param {GetStackOutpout} deployment
 * @param {string[]} resourceIds
 * @returns {GetStackOutpout).Stack}
 */
const pickDeployedResourcesOnly = (deployment, resourceIds) =>
  deployment && deployment.data && deployment.data.resources
    ? mergeObjects(deployment, {
        data: mergeObjects(deployment.data, {
          resources: Object.entries(deployment.data.resources).reduce(
            (acc, [key, obj]) =>
              resourceIds.includes(key)
                ? mergeObjects(acc, { [key]: obj })
                : acc,
            {},
          ),
          result: deployment.data.result
            ? Object.entries(deployment.data.result).reduce(
                (acc, [key, obj]) =>
                  resourceIds.includes(key)
                    ? mergeObjects(acc, { [key]: obj })
                    : acc,
                {},
              )
            : undefined,
        }),
      })
    : deployment

/**
 * @param {any} body
 */
const callApi = body => {
  if (process.env.DEBUG === 'TRUE') {
    console.log('----------------------------------')
    console.log('callApi request', JSON.stringify(body))
  }

  return fetch(API_URL, {
    method: 'post',
    body: JSON.stringify(body),
    headers: mergeObjects(
      { 'Content-Type': 'application/json' },
      API_ACCESS_TOKEN ? { Authorization: `Bearer ${API_ACCESS_TOKEN}` } : {},
    ),
  })
    .then(res => res.text().then(text => ({ text, ok: res.ok })))
    .then(({ text, ok }) => {
      if (process.env.DEBUG === 'TRUE') {
        console.log('callApi response', JSON.stringify(text), 'ok', ok)
        console.log('----------------------------------')
      }

      return { json: JSON.parse(text), ok }
    })
    .then(({ json, ok }) => {
      if (!ok) {
        return Promise.reject(new Error(json.message || `request failed`))
      }

      return json
    })
}

module.exports = {
  isSuccessful,
  getStack,
  deployStack,
  removeStack,
  attachResources,
}
