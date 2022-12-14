import { NAME } from '../../../uri.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(NAME.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  const { firstName } = payload['first-name']
  const { lastName } = payload['last-name']
  Object.assign(licensee, { firstName, lastName })
  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
