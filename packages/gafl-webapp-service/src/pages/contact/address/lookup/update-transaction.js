import { ADDRESS_LOOKUP, ADDRESS_SELECT } from '../../../../constants.js'
import addressLookupService from '../../../../lib/address-lookup-service.js'
import db from 'debug'
const debug = db('webapp:address-lookup')

/**
 * In this case the result of the address search is placed into the page data of the select address page
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  // We can only process this request if there is access to the address lookup
  if (process.env.ADDRESS_LOOKUP_URL && process.env.ADDRESS_LOOKUP_KEY) {
    const { payload } = await request.cache().helpers.page.getCurrentPermission(ADDRESS_LOOKUP.page)
    const addresses = await addressLookupService(payload.premises, payload.postcode)
    await request.cache().helpers.page.setCurrentPermission(ADDRESS_SELECT.page, { addresses: addresses })
  } else {
    debug('The address lookup service is not set up. The system cannot search for the users address')
    await request.cache().helpers.page.setCurrentPermission(ADDRESS_SELECT.page, { addresses: [] })
  }
}
