import transactionHelper from '../../lib/transaction-helper.js'
import { NAME } from '../../constants.js'
import substitutes from './substitutes.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache[NAME.page]

  const permission = await transactionHelper.getPermission(request)
  const contact = permission.contact || {}
  contact.name = {
    firstName: substitutes(payload['first-name']),
    lastName: substitutes(payload['last-name'])
  }
  Object.assign(permission, contact)
  await transactionHelper.setPermission(request, { contact })
}
