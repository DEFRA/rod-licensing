import countryCodes from './country-codes.js'
import { ADDRESS_ENTRY, CONTROLLER, POSTCODE_REGEX, ADDRESS_LOOKUP } from '../../../../constants.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  premises: Joi.string()
    .max(50)
    .trim()
    .required(),
  street: Joi.string()
    .max(50)
    .trim()
    .empty(''),
  locality: Joi.string()
    .max(50)
    .trim()
    .empty(''),
  town: Joi.string()
    .max(50)
    .trim()
    .required(),
  postcode: Joi.alternatives().conditional('country', {
    is: 'GB',
    then: Joi.string()
      .trim()
      .required()
      .regex(POSTCODE_REGEX),
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
