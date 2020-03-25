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
    month: Number.parseInt(payload['date-of-birth-month']) - 1,
    day: payload['date-of-birth-day']
  }).format('YYYY-MM-DD')

  const result = { dateOfBirth, noLicenceRequired: false }

  // Work out the junior or senior concession at the point at which the licence starts
  const permission = await transactionHelper.getPermission(request)

  // We need a licence start date
  if (!permission.licenceStartDate) {
    throw new transactionHelper.TransactionError()
  }

  // Calculate the age when the licence starts
  const ageAtLicenceStartDate = moment(permission.licenceStartDate).diff(moment(dateOfBirth), 'years')

  if (ageAtLicenceStartDate < 13) {
    // Just flag as being under 13 for the router
    Object.assign(result, { noLicenceRequired: true })
  } else if (ageAtLicenceStartDate < 16) {
    // Juniors always fun for 12 months
    Object.assign(result, { concession: 'junior', licenceLength: '12M' })
  } else if (ageAtLicenceStartDate >= 65) {
    Object.assign(result, { concession: 'senior' })
  } else {
    if (permission.concession && ['junior', 'senior'].includes(permission.concession)) {
      Object.assign(result, { concession: false })
    }
  }

  await transactionHelper.setPermission(request, result)
}
