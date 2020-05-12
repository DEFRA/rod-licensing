import { BLUE_BADGE_NUMBER, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'blue-badge-number': Joi.string()
    .max(40)
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(BLUE_BADGE_NUMBER.page, BLUE_BADGE_NUMBER.uri, validator, CONTROLLER.uri)
