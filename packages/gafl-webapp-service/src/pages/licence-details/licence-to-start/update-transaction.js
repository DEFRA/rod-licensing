import transactionHelper from '../../../lib/transaction-helper.js'
import moment from 'moment'
import { LICENCE_TO_START } from '../../../constants.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */

export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache[LICENCE_TO_START.page]
  const permission = { licenceToStart: payload['licence-to-start'] }
  if (payload['licence-to-start'] === 'after-payment') {
    Object.assign(permission, { licenceStartDate: moment().format('YYYY-MM-DD') })
  }
  await transactionHelper.setPermission(request, permission)
}
