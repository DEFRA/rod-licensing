import { ADDRESS_SELECT } from '../../../../uri.js'

/**
 * In this case the result of the address search is placed into the page data of the select address page
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(ADDRESS_SELECT.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  const { addresses } = await request.cache().helpers.addressLookup.getCurrentPermission()
  const { premises, street, locality, town, postcode } = addresses.find(a => a.id === payload.address)
  Object.assign(licensee, { premises, town, postcode, countryCode: 'GB' })

  // Street and locality are optional
  if (street) {
    licensee.street = street
  } else {
    delete licensee.street
  }

  if (locality) {
    licensee.locality = locality
  } else {
    delete licensee.locality
  }

  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
