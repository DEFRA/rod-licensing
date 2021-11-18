import { ADDRESS_SELECT, ADDRESS_LOOKUP, ADDRESS_ENTRY } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from 'joi'
import { nextPage } from '../../../../routes/next-page.js'
import { getPronoun } from '../../../../processors/licence-type-display.js'

export const getData = async request => {
  const { addresses, searchTerms } = await request.cache().helpers.addressLookup.getCurrentPermission()
  const { isLicenceForYou } = await request.cache().helpers.status.getCurrentPermission()

  const pronoun = getPronoun(isLicenceForYou).possessive

  return {
    pronoun,
    addresses,
    searchTerms,
    lookupPage: ADDRESS_LOOKUP.uri,
    entryPage: ADDRESS_ENTRY.uri
  }
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
