'use strict'

import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  dob: Joi.string()
    .min(3)
    .max(10)
}).options({ abortEarly: false })

export default pageRoute('date-of-birth', '/buy/date-of-birth', validator, '/controller')
