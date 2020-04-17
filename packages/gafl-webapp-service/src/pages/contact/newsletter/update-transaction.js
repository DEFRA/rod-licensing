import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { NEWSLETTER } from '../../../constants.js'

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
    licensee.email = payload.email
  } else {
    delete licensee.preferredMethodOfNewsletter
    if (licensee.preferredMethodOfConfirmation !== HOW_CONTACTED.email) {
      delete licensee.email
    }
  }

  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
