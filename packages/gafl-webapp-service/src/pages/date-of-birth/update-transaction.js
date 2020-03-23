import transactionHelper from '../../lib/transaction-helper.js'
import moment from 'moment'
/**
 * Transfer the validated page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache['date-of-birth']
  const dateOfBirth = moment({
    year: payload['date-of-birth-year'],
    month: payload['date-of-birth-month'],
    day: payload['date-of-birth-day']
  }).format('YYYY-MM-DD')
  await transactionHelper.setPermission(request, { dateOfBirth })
}
