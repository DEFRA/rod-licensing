import cacheHelper from '../../../lib/cache-helper.js'
import { LICENCE_LENGTH } from '../../../constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = (await cacheHelper.getPageData(request))[LICENCE_LENGTH.page]
  await cacheHelper.setPermission(request, { licenceLength: payload['licence-length'] })
}
