import { LICENCE_LENGTH, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'licence-length': Joi.string()
    .valid('12M', '8D', '1D')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(LICENCE_LENGTH.page, LICENCE_LENGTH.uri, validator, CONTROLLER.uri)
