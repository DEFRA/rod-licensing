import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { NEWSLETTER } from '../../../uri.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(NEWSLETTER.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()

  if (payload.newsletter === 'yes') {
    licensee.preferredMethodOfNewsletter = HOW_CONTACTED.email
    if (payload.email) {
      licensee.email = payload.email
    }
  } else {
    licensee.preferredMethodOfNewsletter = HOW_CONTACTED.none
  }

  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
