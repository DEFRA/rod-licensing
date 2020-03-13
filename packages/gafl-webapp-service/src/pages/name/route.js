'use strict'

import pageRoute from '../../page-route.js'
import Joi from '@hapi/joi'

export default pageRoute(
  'name',
  '/name',
  Joi.object({
    name: Joi.string()
      .min(3)
      .max(20)
      .required(),
    email: Joi.string()
      .email()
      .required()
  }),
  '/controller'
)
