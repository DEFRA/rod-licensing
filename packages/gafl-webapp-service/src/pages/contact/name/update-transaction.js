import cacheHelper from '../../../lib/cache-helper.js'
import { NAME } from '../../../constants.js'
import substitutes from './substitutes.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = (await cacheHelper.getPageData(request))[NAME.page]

  const permission = await cacheHelper.getPermission(request)
  const contact = permission.contact || {}
  contact.name = {
    firstName: substitutes(payload['first-name']),
    lastName: substitutes(payload['last-name'])
  }
  Object.assign(permission, contact)
  await cacheHelper.setPermission(request, { contact })
}
