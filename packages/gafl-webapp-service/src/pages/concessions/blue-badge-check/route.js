import { BLUE_BADGE_CHECK, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'blue-badge-check': Joi.string()
    .valid('yes', 'no')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(BLUE_BADGE_CHECK.page, BLUE_BADGE_CHECK.uri, validator, CONTROLLER.uri)
