import { BENEFIT_CHECK } from '../../../constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BENEFIT_CHECK.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  if (payload['benefit-check'] === 'no') {
    concessionHelper.removeDisabled(licensee)
    await request.cache().helpers.transaction.setCurrentPermission({ licensee })
  }
}
