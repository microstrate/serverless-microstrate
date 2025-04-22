'use strict'

import { echo } from './layers/echo/print.mjs'

export function hello(event, context, callback) {
  echo('asd')
  return `${JSON.stringify(event)} Hello world!`
}
