import { BLUE_BADGE_CHECK, CONCESSION } from '../../../constants.js'
import updateTransactionFunctions from '../../../handlers/update-transaction-functions.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BLUE_BADGE_CHECK.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // Don't let this be set if we do not have a full adult licence
  if (permission.concession && permission.concession.type === CONCESSION.SENIOR) {
    throw new updateTransactionFunctions.TransactionError('Attempting to set disabled for a senior')
  }

  if (permission.concession && permission.concession.type === CONCESSION.JUNIOR) {
    throw new updateTransactionFunctions.TransactionError('Attempting to set disabled for a junior')
  }

  if (payload['blue-badge-check'] === 'yes') {
    await request.cache().helpers.transaction.setCurrentPermission({ concession: { type: CONCESSION.DISABLED } })
  } else {
    await request.cache().helpers.transaction.setCurrentPermission({ concession: {} })
  }
}
