import { CONCESSION } from '../../../constants.js'
import updateTransactionFunctions from '../../../handlers/update-transaction-functions.js'

export default async (request, page, pageStr) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(page.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()

  // Don't let this be set if we do not have a full adult licence
  if (licensee.concession && licensee.concession.type === CONCESSION.SENIOR) {
    throw new updateTransactionFunctions.TransactionError('Attempting to set disabled for a senior')
  }

  if (licensee.concession && licensee.concession.type === CONCESSION.JUNIOR) {
    throw new updateTransactionFunctions.TransactionError('Attempting to set disabled for a junior')
  }

  if (payload[pageStr] === 'yes') {
    Object.assign(licensee, { concession: { type: CONCESSION.DISABLED } })
  } else {
    Object.assign(licensee, { concession: {} })
  }

  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
