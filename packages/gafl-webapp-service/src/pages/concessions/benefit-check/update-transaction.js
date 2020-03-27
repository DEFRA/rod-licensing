import { BENEFIT_CHECK, CONCESSION } from '../../../constants.js'
import cacheHelper from '../../../lib/cache-helper.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = (await cacheHelper.getPageData(request))[BENEFIT_CHECK.page]
  const permission = await cacheHelper.getPermission(request)
  // Don't let this be set if we do not have a full adult licence
  if (permission.concession === CONCESSION.SENIOR || permission.concession === CONCESSION.JUNIOR) {
    throw new cacheHelper.TransactionError()
  }
  if (payload['benefit-check'] === 'yes') {
    await cacheHelper.setPermission(request, { concession: CONCESSION.DISABLED })
  }
}
