import { LICENCE_TYPE } from '../../../constants.js'
import * as constants from '../../../processors/mapping-constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TYPE.page)

  const permission = {
    licenceType: constants.LICENCE_TYPE[payload['licence-type']]
  }

  if (permission.licenceType === constants.LICENCE_TYPE['salmon-and-sea-trout']) {
    permission.numberOfRods = '1'
  } else {
    // If we toggle in the summary page between licence type we may end up with a 1 rod on
    // a trout and coarse which is not allowed
    permission.numberOfRods = '2'
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}
