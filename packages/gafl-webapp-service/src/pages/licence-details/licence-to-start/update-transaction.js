import moment from 'moment-timezone'
import { ageConcessionHelper, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { LICENCE_START_TIME, LICENCE_TO_START } from '../../../uri.js'
import { cacheDateFormat } from '../../../processors/date-and-time-display.js'
import { onLengthChange } from '../licence-length/update-transaction.js'

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
    permission.licenceStartDate = moment()
      .tz(SERVICE_LOCAL_TIME)
      .format(cacheDateFormat)
    delete permission.licenceStartTime
  } else {
    permission.licenceToStart = licenceToStart.ANOTHER_DATE
    permission.licenceStartDate = moment({
      year: payload['licence-start-date-year'],
      month: Number.parseInt(payload['licence-start-date-month']) - 1,
      day: payload['licence-start-date-day']
    }).format(cacheDateFormat)
  }

  // Write the age concessions into the cache
  ageConcessionHelper(permission)
  onLengthChange(permission)

  await request.cache().helpers.transaction.setCurrentPermission(permission)

  // Clear the start time always here otherwise it can end up being set incorrectly
  await request.cache().helpers.page.setCurrentPermission(LICENCE_START_TIME.page, {})
}
