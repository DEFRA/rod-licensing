import transactionHelper from '../../lib/transaction-helper.js'
import { NUMBER_OF_RODS } from '../../constants.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache[NUMBER_OF_RODS.page]
  await transactionHelper.setPermission(request, { numberOfRods: payload['number-of-rods'] })
}
