import { ADDRESS_SELECT } from '../../../../constants.js'

export default async request => {
  const { addresses } = await request.cache().helpers.page.getCurrentPermission(ADDRESS_SELECT.page)
  return addresses.length ? 'foundSome' : 'foundNone'
}
