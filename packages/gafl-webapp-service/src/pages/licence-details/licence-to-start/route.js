import { LICENCE_TO_START, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'licence-to-start': Joi.string()
    .valid('after-payment', 'another-date-or-time')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(LICENCE_TO_START.page, LICENCE_TO_START.uri, validator, CONTROLLER.uri)
