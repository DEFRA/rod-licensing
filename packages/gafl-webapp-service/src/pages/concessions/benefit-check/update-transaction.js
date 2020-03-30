import { BENEFIT_CHECK, CONCESSION } from '../../../constants.js'
import updateTransactionFunctions from '../../../handlers/update-transaction-functions.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BENEFIT_CHECK.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  // Don't let this be set if we do not have a full adult licence
  if (permission.concession === CONCESSION.SENIOR || permission.concession === CONCESSION.JUNIOR) {
    throw new updateTransactionFunctions.TransactionError()
  }
  if (payload['benefit-check'] === 'yes') {
    await request.cache().helpers.transaction.setCurrentPermission({ concession: CONCESSION.DISABLED })
  }
}
