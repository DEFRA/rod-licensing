'use strict'

import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'
import { NAME, CONTROLLER } from '../../constants.js'

const validator = Joi.object({
  name: Joi.string()
    .min(3)
    .max(20)
    .required(),
  email: Joi.string()
    .email()
    .required()
}).options({ abortEarly: false })

export default pageRoute(NAME.page, NAME.uri, validator, CONTROLLER.uri)
