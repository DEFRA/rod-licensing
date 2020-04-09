import { NAME } from '../../../constants.js'
import substitutes from './substitutes.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(NAME.page)

  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  licensee.firstName = substitutes(payload['first-name'])
  licensee.lastName = substitutes(payload['last-name'])

  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
