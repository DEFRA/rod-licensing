import { BLUE_BADGE_CHECK } from '../../../constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BLUE_BADGE_CHECK.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  if (payload['blue-badge-check'] === 'no') {
    concessionHelper.removeDisabled(licensee)
    await request.cache().helpers.transaction.setCurrentPermission({ licensee })
  }
}
