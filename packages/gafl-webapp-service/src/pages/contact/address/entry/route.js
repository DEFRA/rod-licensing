import { ADDRESS_ENTRY, CONTROLLER, ADDRESS_LOOKUP } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { validation } from '@defra-fish/business-rules-lib'
import { countries } from '../../../../processors/refdata-helper.js'

const validator = Joi.object({
  premises: validation.contact.createPremisesValidator(Joi),
  street: validation.contact.createStreetValidator(Joi),
  locality: validation.contact.createLocalityValidator(Joi),
  town: validation.contact.createTownValidator(Joi),
  postcode: Joi.alternatives().conditional('country-code', {
    is: 'GB',
    then: validation.contact.createUKPostcodeValidator(Joi),
    otherwise: validation.contact.createOverseasPostcodeValidator(Joi)
  }),
  'country-code': Joi.string().required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(ADDRESS_ENTRY.page, ADDRESS_ENTRY.uri, validator, CONTROLLER.uri, async () => ({
  countries: await countries.getAll(),
  lookupPage: ADDRESS_LOOKUP.uri
}))
