import { HOW_CONTACTED } from './mapping-constants.js'

const min_age_for_recurring_payment = 18;

export const recurringPayReminderDisplay = (permission, mssgs) => {
  if (permission.licensee.preferredMethodOfReminder === HOW_CONTACTED.email) {
    return mssgs.recurring_payment_set_up_bulletpoint_5_email
  } else if (permission.licensee.preferredMethodOfReminder === HOW_CONTACTED.letter) {
    return mssgs.recurring_payment_set_up_bulletpoint_5_letter
  }
  return mssgs.recurring_payment_set_up_bulletpoint_5_text
}

export const validForRecurringPayment = permission =>
  process.env.SHOW_RECURRING_PAYMENTS?.toLowerCase() === 'true' &&
  permission.licenceLength === '12M' &&
  permission.isLicenceForYou &&
  permission.licensee.age >= min_age_for_recurring_payment &&
  process.env.CHANNEL?.toLowerCase() !== 'telesales'
