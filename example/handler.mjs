'use strict'

export function hello(event, context) {
  return `${JSON.stringify(event, null, 2)} ${JSON.stringify(context, null, 2)} Hello world!`
}
