import { ADDRESS_LOOKUP } from '../../../../constants.js'
import addressLookupService from '../../../../services/address-lookup/address-lookup-service.js'
import db from 'debug'
import { validation } from '@defra-fish/business-rules-lib'
const debug = db('webapp:address-lookup')

/**
 * In this case the result of the address search is placed into the address lookup cache
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(ADDRESS_LOOKUP.page)
  // Clean up the postcode
  payload.postcode = payload.postcode.replace(validation.contact.ukPostcodeRegex, '$1 $2').toUpperCase()
  // We can only process this request if there is access to the address lookup
  if (process.env.ADDRESS_LOOKUP_URL && process.env.ADDRESS_LOOKUP_KEY) {
    const addresses = await addressLookupService(payload.premises, payload.postcode)
    await request.cache().helpers.addressLookup.setCurrentPermission({
      addresses: addresses,
      searchTerms: { premises: payload.premises, postcode: payload.postcode }
    })
  } else {
    debug('The address lookup service is not set up. The system cannot search for the users address')
    await request.cache().helpers.addressLookup.setCurrentPermission({ addresses: [] })
  }
}
