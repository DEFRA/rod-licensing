import { LICENCE_LENGTH } from '../../../constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_LENGTH.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // Setting the licence length to anything other that 12 months removes disabled concessions
  if (payload['licence-length'] !== '12M' && concessionHelper.hasDisabled(permission.licensee)) {
    concessionHelper.removeDisabled(permission.licensee)
    await request.cache().helpers.transaction.setCurrentPermission(permission)
  }

  await request.cache().helpers.transaction.setCurrentPermission({ licenceLength: payload['licence-length'] })
}
