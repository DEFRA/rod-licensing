import transactionHelper from '../../../lib/transaction-helper.js'
import { LICENCE_START_TIME } from '../../../constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache[LICENCE_START_TIME.page]
  await transactionHelper.setPermission(request, { licenceStartTime: payload['licence-start-time'] })
}
