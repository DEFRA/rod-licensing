import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { NAME, CONTROLLER } from '../../../constants.js'
import { validation } from '@defra-fish/business-rules-lib'

const validator = Joi.object({
  'first-name': validation.contact.firstNameValidator,
  'last-name': validation.contact.lastNameValidator
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(NAME.page, NAME.uri, validator, CONTROLLER.uri)
