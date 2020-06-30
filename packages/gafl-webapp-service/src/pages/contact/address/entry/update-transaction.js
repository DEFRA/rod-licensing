import { ADDRESS_ENTRY } from '../../../../uri.js'

/**
 * In this case the result of the address search is placed into the page data of the select address page
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(ADDRESS_ENTRY.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  const { premises, street, locality, town, postcode, 'country-code': countryCode } = payload
  Object.assign(licensee, { premises, street, locality, town, postcode, countryCode, organisation: null })
  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
