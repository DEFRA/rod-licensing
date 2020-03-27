import { BENEFIT_CHECK, CONTROLLER } from '../../../constants.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'benefit-check': Joi.string()
    .valid('yes', 'no')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(BENEFIT_CHECK.page, BENEFIT_CHECK.uri, validator, CONTROLLER.uri)
