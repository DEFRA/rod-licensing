import { CONTACT, CONTROLLER } from '../../../constants.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  email: Joi.string()
    .trim()
    .required()
    .max(50),
  mobile: Joi.string()
    .trim()
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(CONTACT.page, CONTACT.uri, validator, CONTROLLER.uri)
