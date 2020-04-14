import { NEWSLETTER, HOW_CONTACTED } from '../../../constants.js'

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
  }

  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
