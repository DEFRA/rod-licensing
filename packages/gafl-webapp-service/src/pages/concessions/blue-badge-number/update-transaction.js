import { BLUE_BADGE_NUMBER } from '../../../constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import { CONCESSION_PROOF } from '../../../processors/mapping-constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BLUE_BADGE_NUMBER.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  concessionHelper.addDisabled(licensee, CONCESSION_PROOF.blueBadge, payload['blue-badge-number'])
  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
