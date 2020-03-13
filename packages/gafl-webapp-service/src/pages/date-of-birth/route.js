'use strict'

import pageRoute from '../../page-route.js'
import Joi from '@hapi/joi'

export default pageRoute(
  'date-of-birth',
  '/date-of-birth',
  Joi.object({
    dob: Joi.string()
      .min(3)
      .max(10)
  }),
  '/controller'
)
