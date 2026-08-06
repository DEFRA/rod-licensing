import { HOW_CONTACTED } from './mapping-constants.js'
import { SERVICE_LOCAL_TIME, RECURRING_PAYMENT_MIN_AGE } from '@defra-fish/business-rules-lib'
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
    permission.licenceLength === '12M' &&
    permission.isLicenceForYou &&
    licenseeAge >= RECURRING_PAYMENT_MIN_AGE &&
    process.env.CHANNEL?.toLowerCase() !== 'telesales'
  )
}

export const isRecurringPayment = transaction => !!transaction.agreementId
