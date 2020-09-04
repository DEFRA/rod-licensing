import * as mappings from '../../../processors/mapping-constants.js'
import { LICENCE_LENGTH } from '../../../uri.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import { checkAfterPayment } from '../licence-to-start/update-transaction.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_LENGTH.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  permission.licenceLength = payload['licence-length']

  // Setting the licence length to anything other that 12 months removes disabled concessions
  if (permission.licenceLength !== '12M') {
    concessionHelper.removeDisabled(permission)
    if (permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
      permission.numberOfRods = '2'
    }
  } else {
    checkAfterPayment(permission)
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}
