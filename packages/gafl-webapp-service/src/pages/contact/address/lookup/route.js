import { ADDRESS_LOOKUP, CONTROLLER, POSTCODE_REGEX, ADDRESS_ENTRY } from '../../../../constants.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  premises: Joi.string()
    .trim()
    .required()
    .max(50),
  postcode: Joi.string()
    .trim()
    .required()
    .regex(POSTCODE_REGEX)
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(ADDRESS_LOOKUP.page, ADDRESS_LOOKUP.uri, validator, CONTROLLER.uri, () => ({ entryPage: ADDRESS_ENTRY.uri }))
