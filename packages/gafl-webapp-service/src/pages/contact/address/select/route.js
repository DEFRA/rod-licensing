import { ADDRESS_SELECT, ADDRESS_LOOKUP, ADDRESS_ENTRY } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { nextPage } from '../../../../routes/next-page.js'

const getData = async request => {
  const { addresses, searchTerms } = await request.cache().helpers.addressLookup.getCurrentPermission()
  return { lookupPage: ADDRESS_LOOKUP.uri, entryPage: ADDRESS_ENTRY.uri, addresses, searchTerms }
}

export default pageRoute(
  ADDRESS_SELECT.page,
  ADDRESS_SELECT.uri,
  Joi.object({
    address: Joi.number()
      .integer()
      .min(0)
      .required()
  }).options({ abortEarly: false, allowUnknown: true }),
  nextPage,
  getData
)
