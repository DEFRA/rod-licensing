import { HOW_CONTACTED } from '../processors/mapping-constants.js'

export const recurringPayReminderDisplay = (permission, mssgs) => {
  if (permission.preferredMethodOfReminder === HOW_CONTACTED.email) {
    return mssgs.recurring_payment_set_up_bulletpoint_4_email
  } else if (permission.preferredMethodOfReminder === HOW_CONTACTED.letter) {
    return mssgs.recurring_payment_set_up_bulletpoint_4_letter
  }
  return mssgs.recurring_payment_set_up_bulletpoint_4_text
}
