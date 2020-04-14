import countryCodes from './country-codes.js'
import { ADDRESS_ENTRY, CONTROLLER, ADDRESS_LOOKUP } from '../../../../constants.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { validation } from '@defra-fish/business-rules-lib'

const validator = Joi.object({
  premises: validation.contact.premisesValidator,
  street: validation.contact.streetValidator,
  locality: validation.contact.localityValidator,
  town: validation.contact.townValidator,
  postcode: Joi.alternatives().conditional('country-code', {
    is: 'GB',
    then: validation.contact.ukPostcodeValidator,
    otherwise: Joi.string()
      .trim()
      .required()
  }),
  'country-code': Joi.string()
    .valid(...countryCodes.map(c => c.code))
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(ADDRESS_ENTRY.page, ADDRESS_ENTRY.uri, validator, CONTROLLER.uri, () => ({
  countries: [{ code: null, name: null }].concat(countryCodes),
  lookupPage: ADDRESS_LOOKUP.uri
}))
