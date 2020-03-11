'use strict'

import handler from './handler.js'
import Joi from '@hapi/joi'

export default {
  method: ['GET', 'POST'],
  path: '/name',
  handler: handler
  // options: {
  //   validate: {
  //     payload: Joi.object({
  //       name: Joi.string().min(3).max(10)
  //     })
  //   },
  //   failAction: async (request, h, err) => {
  //     return 'error'
  //   }
  // }
}
