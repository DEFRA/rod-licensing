import Joi from 'joi'

import { LICENCE_FOR } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'

const validator = Joi.object({
  'licence-for': Joi.string()
    .valid('you', 'someone-else')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(LICENCE_FOR.page, LICENCE_FOR.uri, validator, nextPage)
