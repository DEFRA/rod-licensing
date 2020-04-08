import { NEWSLETTER } from '../../../constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(NEWSLETTER.page)

  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const contact = permission.contact || {}

  if (payload.newsletter === 'yes') {
    contact.marketingFlag = true
    contact.emailAddress = payload.email
  } else {
    contact.marketingFlag = false
  }

  Object.assign(permission, contact)
  await request.cache().helpers.transaction.setCurrentPermission({ contact })
}
