import { BENEFIT_NI_NUMBER, CONTROLLER } from '../../../constants.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'ni-number': Joi.string()
    .max(15)
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(BENEFIT_NI_NUMBER.page, BENEFIT_NI_NUMBER.uri, validator, CONTROLLER.uri)
