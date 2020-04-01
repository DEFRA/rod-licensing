import moment from 'moment'
import { DATE_OF_BIRTH, CONCESSION } from '../../../constants.js'
import updateTransactionFunctions from '../../../handlers/update-transaction-functions.js'
/**
 * Transfer the validated page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(DATE_OF_BIRTH.page)

  const dateOfBirth = moment({
    year: payload['date-of-birth-year'],
    month: Number.parseInt(payload['date-of-birth-month']) - 1,
    day: payload['date-of-birth-day']
  }).format('YYYY-MM-DD')

  const result = { dateOfBirth, noLicenceRequired: false }

  // Work out the junior or senior concession at the point at which the licence starts
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // We need a licence start date
  if (!permission.licenceStartDate) {
    throw new updateTransactionFunctions.TransactionError('No licence start date')
  }

  // Calculate the age when the licence starts
  const ageAtLicenceStartDate = moment(permission.licenceStartDate).diff(moment(dateOfBirth), 'years')

  if (ageAtLicenceStartDate < 13) {
    // Just flag as being under 13 for the router
    Object.assign(result, { noLicenceRequired: true })
  } else if (ageAtLicenceStartDate < 16) {
    // Juniors always fun for 12 months
    Object.assign(result, { concession: { type: CONCESSION.JUNIOR }, licenceLength: '12M' })
  } else if (ageAtLicenceStartDate >= 65) {
    Object.assign(result, { concession: { type: CONCESSION.SENIOR } })
  } else {
    if (permission.concession && [CONCESSION.JUNIOR, CONCESSION.SENIOR].includes(permission.concession.type)) {
      Object.assign(result, { concession: {} })
    }
  }

  await request.cache().helpers.transaction.setCurrentPermission(result)
}
