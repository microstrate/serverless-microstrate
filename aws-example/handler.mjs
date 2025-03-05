'use strict'

export function hello(event, context, callback) {
  return `${JSON.stringify(event)} Hello world!`
}
