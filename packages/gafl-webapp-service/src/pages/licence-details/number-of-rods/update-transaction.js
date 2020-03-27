import cacheHelper from '../../../lib/cache-helper.js'
import { NUMBER_OF_RODS } from '../../../constants.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = (await cacheHelper.getPageData(request))[NUMBER_OF_RODS.page]
  await cacheHelper.setPermission(request, { numberOfRods: payload['number-of-rods'] })
}
