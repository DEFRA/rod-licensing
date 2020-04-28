import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { NAME, CONTROLLER } from '../../../uri.js'
import { validation } from '@defra-fish/business-rules-lib'

const validator = Joi.object({
  'first-name': validation.contact.createFirstNameValidator(Joi),
  'last-name': validation.contact.createLastNameValidator(Joi)
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(NAME.page, NAME.uri, validator, CONTROLLER.uri)
