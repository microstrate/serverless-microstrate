'use strict'

const cloneObj = obj => JSON.parse(JSON.stringify(obj))

const isEmpty = val =>
  val === null ||
  val === undefined ||
  (typeof val === 'string' && val.trim().length === 0) ||
  (Array.isArray(val) && val.length === 0) ||
  (typeof val === 'object' && Object.keys(val).length === 0)

const isNotEmpty = val => !isEmpty(val)

const cleanObjEmptyProps = obj => {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanObjEmptyProps).filter(isNotEmpty)
  }

  return Object.entries(obj).reduce((acc, [key, val]) => {
    const newValue = cleanObjEmptyProps(val)

    if (isEmpty(newValue)) {
      return acc
    } else {
      return Object.assign(acc, { [key]: newValue })
    }
  }, {})
}

module.exports = {
  isEmpty,
  cloneObj,
  cleanObjEmptyProps,
}
