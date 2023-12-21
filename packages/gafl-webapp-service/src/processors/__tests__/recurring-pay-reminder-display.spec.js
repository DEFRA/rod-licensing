import { recurringPayReminderDisplay } from '../recurring-pay-reminder-display.js'

const getCatalog = () => ({
  recurring_payment_set_up_bulletpoint_5_email: 'we will send you an email showing the cost before the next payment is taken',
  recurring_payment_set_up_bulletpoint_5_letter: 'we will send you a letter showing the cost before the next payment is taken',
  recurring_payment_set_up_bulletpoint_5_text: 'we will send you a text message showing the cost before the next payment is taken'
})

const getPermission = reminder => ({
  licensee: {
    preferredMethodOfReminder: reminder
  }
})

describe('recurringPayReminderDisplay', () => {
  it.each([
    ['Email', 'we will send you an email showing the cost before the next payment is taken'],
    ['Letter', 'we will send you a letter showing the cost before the next payment is taken'],
    ['Text', 'we will send you a text message showing the cost before the next payment is taken']
  ])('when reminder is %s, recurringPayReminderDisplay will return "%s"', (reminder, expected) => {
    const permission = getPermission(reminder)
    const result = recurringPayReminderDisplay(permission, getCatalog())
    expect(result).toEqual(expected)
  })
})
