import transactionHelper from '../../lib/transaction-helper.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache['number-of-rods']
  await transactionHelper.setPermission(request, { numberOfRods: payload['number-of-rods'] })
}
