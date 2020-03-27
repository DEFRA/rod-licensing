import cacheHelper from '../../../lib/cache-helper.js'
import { LICENCE_START_TIME } from '../../../constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = (await cacheHelper.getPageData(request))[LICENCE_START_TIME.page]
  await cacheHelper.setPermission(request, { licenceStartTime: payload['licence-start-time'] })
}
