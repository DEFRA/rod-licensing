import { LICENCE_LENGTH } from '../../../constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import * as mappings from '../../../processors/mapping-constants.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_LENGTH.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // Setting the licence length to anything other that 12 months removes disabled concessions
  if (payload['licence-length'] !== '12M') {
    concessionHelper.removeDisabled(permission.licensee)
    if (permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
      permission.numberOfRods = '2'
    }
    await request.cache().helpers.transaction.setCurrentPermission(permission)
  }

  await request.cache().helpers.transaction.setCurrentPermission({ licenceLength: payload['licence-length'] })
}
