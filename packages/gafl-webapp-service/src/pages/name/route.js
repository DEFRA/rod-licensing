'use strict'

import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  name: Joi.string()
    .min(3)
    .max(20)
    .required(),
  email: Joi.string()
    .email()
    .required()
}).options({ abortEarly: false })

export default pageRoute('name', '/buy/name', validator, '/buy')
