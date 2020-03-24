import transactionHelper from '../../lib/transaction-helper.js'
import moment from 'moment'
/**
 * Transfer the validated page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache['licence-start-date']
  const licenceStartDate = moment({
    year: payload['licence-start-date-year'],
    month: Number.parseInt(payload['licence-start-date-month']) - 1,
    day: payload['licence-start-date-day']
  }).format('YYYY-MM-DD')
  await transactionHelper.setPermission(request, { licenceStartDate })
}
