'use strict'

const parseNumber = val => {
  if (val === undefined || val === null) {
    return undefined
  }
  if (typeof val === 'string' && val.trim().length === 0) {
    return undefined
  }

  const parsed = Number(String(val).trim())

  return isNaN(parsed) ? undefined : parsed
}

const parseBoolean = val => {
  if (val === undefined || val === null) {
    return undefined
  }

  if (typeof val === 'boolean') {
    return val
  }

  if (typeof val === 'string') {
    const valAsString = val.toLowerCase()
    if (['on', 'true', 'yes', 'y'].indexOf(valAsString) !== -1) {
      return true
    }
    if (['off', 'false', 'no', 'n'].indexOf(valAsString) !== -1) {
      return false
    }
  }

  return undefined
}

module.exports = {
  parseBoolean,
  parseNumber,
}
