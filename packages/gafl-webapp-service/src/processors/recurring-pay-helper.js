import { HOW_CONTACTED } from './mapping-constants.js'

export const recurringPayReminderDisplay = (permission, mssgs) => {
  if (permission.licensee.preferredMethodOfReminder === HOW_CONTACTED.email) {
    return mssgs.recurring_payment_set_up_bulletpoint_5_email
  } else if (permission.licensee.preferredMethodOfReminder === HOW_CONTACTED.letter) {
    return mssgs.recurring_payment_set_up_bulletpoint_5_letter
  }
  return mssgs.recurring_payment_set_up_bulletpoint_5_text
}

export const validForRecurringPayment = (permission) => {
  if (process.env.SHOW_RECURRING_PAYMENTS?.toLowerCase() === 'true' && permission.licenceLength === '12M' && permission.isLicenceForYou === true) {
    return true
  }
  return false
}
