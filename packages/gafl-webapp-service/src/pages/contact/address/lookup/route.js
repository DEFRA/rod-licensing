import { ADDRESS_LOOKUP, CONTROLLER, ADDRESS_ENTRY } from '../../../../constants.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { validation } from '@defra-fish/business-rules-lib'

const validator = Joi.object({
  premises: validation.contact.premisesValidator,
  postcode: validation.contact.ukPostcodeValidator
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(ADDRESS_LOOKUP.page, ADDRESS_LOOKUP.uri, validator, CONTROLLER.uri, () => ({ entryPage: ADDRESS_ENTRY.uri }))
