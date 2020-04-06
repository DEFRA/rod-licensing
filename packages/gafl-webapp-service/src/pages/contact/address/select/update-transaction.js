import { ADDRESS_SELECT } from '../../../../constants.js'

/**
 * In this case the result of the address search is placed into the page data of the select address page
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(ADDRESS_SELECT.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const contact = permission.contact || {}
  const { addresses } = await request.cache().helpers.addressLookup.getCurrentPermission()
  const { premises, street, locality, town, postcode, country } = addresses.find(a => a.id === payload.address)
  Object.assign(contact, { address: { premises, street, locality, town, postcode, country } })
  await request.cache().helpers.transaction.setCurrentPermission({ contact })
}
