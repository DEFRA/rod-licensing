import { ADDRESS_ENTRY } from '../../../../uri.js'
import { licenceDetailsService } from '../../../../services/licence-details/licence-details-service.js'

/**
 * In this case the result of the address search is placed into the page data of the select address page
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(ADDRESS_ENTRY.page)
  const { licensee, licenceLength } = await request.cache().helpers.transaction.getCurrentPermission()
  const { premises, street, locality, town, postcode, 'country-code': countryCode } = payload
  Object.assign(licensee, { premises, street, locality, town, postcode, countryCode, organisation: null })
  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
  if (licenceLength === '12M') {
    const { firstName, lastName, birthDate } = licensee
    const existingPermissions = await licenceDetailsService({ firstName, lastName, birthDate, postcode })
    await request.cache().helpers.existingPermissions.set(existingPermissions)
  }
}
