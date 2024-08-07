import { HOW_CONTACTED } from './mapping-constants.js'
import { JUNIOR_MAX_AGE, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import moment from 'moment-timezone'

export const recurringPayReminderDisplay = (permission, mssgs) => {
  if (permission.licensee.preferredMethodOfReminder === HOW_CONTACTED.email) {
    return mssgs.recurring_payment_set_up_bulletpoint_5_email
  } else if (permission.licensee.preferredMethodOfReminder === HOW_CONTACTED.letter) {
    return mssgs.recurring_payment_set_up_bulletpoint_5_letter
  }
  return mssgs.recurring_payment_set_up_bulletpoint_5_text
}

export const validForRecurringPayment = permission => {
  const licenseeAge = moment().tz(SERVICE_LOCAL_TIME).diff(moment(permission.licensee.birthDate), 'years')
  return (
    process.env.SHOW_RECURRING_PAYMENTS?.toLowerCase() === 'true' &&
    permission.licenceLength === '12M' &&
    permission.isLicenceForYou &&
    licenseeAge > JUNIOR_MAX_AGE &&
    process.env.CHANNEL?.toLowerCase() !== 'telesales'
  )
}
