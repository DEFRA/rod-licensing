import transactionHelper from '../../lib/transaction-helper.js'
import moment from 'moment'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */

const LICENCE_TO_START = 'licence-to-start'

export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache[LICENCE_TO_START]
  const permission = { licenceToStart: payload[LICENCE_TO_START] }
  if (payload[LICENCE_TO_START] === 'after-payment') {
    Object.assign(permission, { licenceStartDate: moment().format('YYYY-MM-DD') })
  }
  await transactionHelper.setPermission(request, permission)
}
