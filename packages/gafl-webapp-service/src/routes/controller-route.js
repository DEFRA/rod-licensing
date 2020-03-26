'use strict'

import { CONTROLLER } from '../constants.js'
import controllerHandler from '../handlers/controller-handler.js'

export default {
  method: 'GET',
  path: CONTROLLER.uri,
  handler: controllerHandler
}
