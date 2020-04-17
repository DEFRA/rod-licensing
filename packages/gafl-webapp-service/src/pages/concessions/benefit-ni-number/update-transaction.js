import { BENEFIT_NI_NUMBER } from '../../../constants.js'
import { CONCESSION_PROOF } from '../../../processors/mapping-constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BENEFIT_NI_NUMBER.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  concessionHelper.addDisabled(licensee, CONCESSION_PROOF.NI, payload['ni-number'])
  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
