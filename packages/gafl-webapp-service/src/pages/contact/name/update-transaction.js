import { NAME } from '../../../constants.js'
import substitutes from './substitutes.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(NAME.page)

  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const contact = permission.contact || {}
  contact.name = {
    firstName: substitutes(payload['first-name']),
    lastName: substitutes(payload['last-name'])
  }
  Object.assign(permission, contact)
  await request.cache().helpers.transaction.setCurrentPermission({ contact })
}
