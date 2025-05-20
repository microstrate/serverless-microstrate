'use strict'

const fetch = require('node-fetch')
const { mergeObjects } = require('./utils')

const createDeployAPI = (apiUrl, apiKey) => {
  /**
   * @param {'post'|'get'|'patch'|'delete'} method
   * @returns {(path: string, body?: any) => Promise<any>}
   */
  const callApi = method => (path, body) => {
    if (process.env.DEBUG === 'TRUE') {
      console.log('----------------------------------')
      console.log(
        'Api request',
        method,
        path,
        'body:',
        JSON.stringify(body),
        apiKey,
      )
    }

    return fetch(`${apiUrl}${path}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
    })
      .then(res =>
        res.text().then(text => ({ text, ok: res.ok, status: res.status })),
      )
      .then(({ text, ok, status }) => {
        if (process.env.DEBUG === 'TRUE') {
          console.log('Api response', status, JSON.stringify(text), 'ok', ok)
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
  const apiPost = callApi('post')
  const apiPatch = callApi('patch')
  const apiGet = path => callApi('get')(path)
  const apiDelete = path => callApi('delete')(path)

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
    apiPost('/deployment/stacks', body)
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
      apiGet(
        `/deployment/stacks/${encodeURIComponent(body.name)}/stages/${encodeURIComponent(body.stage)}`,
      ).then(r =>
        typeof poll === 'boolean' ? r : pickDeployedResourcesOnly(r, poll),
      )

    return poll
      ? [...Array(10).keys()].reduce(
          (chain, _) =>
            chain.then(acc =>
              acc &&
              acc.data &&
              !Object.values(acc.data.result).some(
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
  const removeStack = body =>
    apiDelete(
      `/deployment/stacks/${encodeURIComponent(body.name)}/stages/${encodeURIComponent(body.stage)}`,
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

  return {
    isSuccessful,
    getStack,
    deployStack,
    removeStack,
  }
}

module.exports = {
  createDeployAPI,
}
