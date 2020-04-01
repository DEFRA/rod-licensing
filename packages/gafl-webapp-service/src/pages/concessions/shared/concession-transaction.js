import { CONCESSION } from '../../../constants.js'
import updateTransactionFunctions from '../../../handlers/update-transaction-functions.js'

export default async (request, page, pageStr) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(page.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // Don't let this be set if we do not have a full adult licence
  if (permission.concession && permission.concession.type === CONCESSION.SENIOR) {
    throw new updateTransactionFunctions.TransactionError('Attempting to set disabled for a senior')
  }

  if (permission.concession && permission.concession.type === CONCESSION.JUNIOR) {
    throw new updateTransactionFunctions.TransactionError('Attempting to set disabled for a junior')
  }

  if (payload[pageStr] === 'yes') {
    await request.cache().helpers.transaction.setCurrentPermission({ concession: { type: CONCESSION.DISABLED } })
  } else {
    await request.cache().helpers.transaction.setCurrentPermission({ concession: {} })
  }
}
