import cacheHelper from '../../../lib/cache-helper.js'
import moment from 'moment'
import { LICENCE_TO_START } from '../../../constants.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */

export default async request => {
  const { payload } = (await cacheHelper.getPageData(request))[LICENCE_TO_START.page]
  const permission = { licenceToStart: payload['licence-to-start'] }
  if (payload['licence-to-start'] === 'after-payment') {
    Object.assign(permission, { licenceStartDate: moment().format('YYYY-MM-DD') })
  }
  await cacheHelper.setPermission(request, permission)
}
