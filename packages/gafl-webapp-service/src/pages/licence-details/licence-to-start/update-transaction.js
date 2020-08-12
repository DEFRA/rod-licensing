import moment from 'moment'
import { LICENCE_TO_START, LICENCE_START_TIME } from '../../../uri.js'
import { ageConcessionHelper } from '../../../processors/concession-helper.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export const licenceToStart = {
  AFTER_PAYMENT: 'after-payment',
  ANOTHER_DATE: 'another-date'
}

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TO_START.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (payload['licence-to-start'] === 'after-payment') {
    permission.licenceToStart = licenceToStart.AFTER_PAYMENT
    permission.licenceStartDate = moment().format('YYYY-MM-DD')
    delete permission.licenceStartTime
  } else {
    permission.licenceToStart = licenceToStart.ANOTHER_DATE
    permission.licenceStartDate = moment({
      year: payload['licence-start-date-year'],
      month: Number.parseInt(payload['licence-start-date-month']) - 1,
      day: payload['licence-start-date-day']
    }).format('YYYY-MM-DD')
  }

  // Write the age concessions into the cache
  ageConcessionHelper(permission)

  await request.cache().helpers.transaction.setCurrentPermission(permission)

  // Clear the start time always here otherwise it can end up being set incorrectly
  await request.cache().helpers.page.setCurrentPermission(LICENCE_START_TIME.page, {})
}
