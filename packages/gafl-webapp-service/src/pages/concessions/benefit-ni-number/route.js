import { BENEFIT_NI_NUMBER, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { validation } from '@defra-fish/business-rules-lib'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'ni-number': validation.contact.createNationalInsuranceNumberValidator(Joi)
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(BENEFIT_NI_NUMBER.page, BENEFIT_NI_NUMBER.uri, validator, CONTROLLER.uri)
