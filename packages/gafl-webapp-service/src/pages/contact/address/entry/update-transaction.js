import { ADDRESS_ENTRY, POSTCODE_REGEX } from '../../../../constants.js'

/**
 * In this case the result of the address search is placed into the page data of the select address page
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(ADDRESS_ENTRY.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()

  // Clean up the postcode if GB
  if (payload['country-code'] === 'GB') {
    payload.postcode = payload.postcode.replace(POSTCODE_REGEX, '$2 $3').toUpperCase()
    await request.cache().helpers.page.setCurrentPermission(ADDRESS_ENTRY.page, payload)
  }

  const { premises, street, locality, town, postcode, 'country-code': countryCode } = payload
  Object.assign(licensee, { premises, street, locality, town, postcode, countryCode })
  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
