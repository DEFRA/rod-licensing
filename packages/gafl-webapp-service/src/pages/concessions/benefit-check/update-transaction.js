import transactionHelper from '../../../lib/transaction-helper.js'
import { BENEFIT_CHECK, CONCESSION } from '../../../constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache[BENEFIT_CHECK.page]
  const permission = await transactionHelper.getPermission(request)
  // Don't let this be set if we do not have a full adult licence
  if (permission.concession === CONCESSION.SENIOR || permission.concession === CONCESSION.JUNIOR) {
    throw new transactionHelper.TransactionError()
  }
  if (payload['benefit-check'] === 'yes') {
    await transactionHelper.setPermission(request, { concession: CONCESSION.DISABLED })
  }
}
