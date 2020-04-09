import { BLUE_BADGE_NUMBER, CONCESSION } from '../../../constants.js'
import updateTransactionFunctions from '../../../handlers/update-transaction-functions.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BLUE_BADGE_NUMBER.page)
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()

  // Don't let this be set if we do not have a disabled concession set
  if (!licensee.concession || licensee.concession.type !== CONCESSION.DISABLED) {
    throw new updateTransactionFunctions.TransactionError('Attempting to set blue badge number without a disabled concessions')
  }

  Object.assign(licensee, {
    concession: {
      type: CONCESSION.DISABLED,
      blueBadgeNumber: payload['blue-badge-number']
    }
  })

  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
