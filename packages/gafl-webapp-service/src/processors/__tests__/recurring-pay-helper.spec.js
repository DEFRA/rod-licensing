import { recurringPayReminderDisplay, validForRecurringPayment } from '../recurring-pay-helper.js'

const getCatalog = () => ({
  recurring_payment_set_up_bulletpoint_5_email: 'we will send you an email showing the cost before the next payment is taken',
  recurring_payment_set_up_bulletpoint_5_letter: 'we will send you a letter showing the cost before the next payment is taken',
  recurring_payment_set_up_bulletpoint_5_text: 'we will send you a text message showing the cost before the next payment is taken'
})

const getPermission = ({ reminder, licenceFor, length, age }) => ({
  licensee: {
    preferredMethodOfReminder: reminder,
    age: age
  },
  isLicenceForYou: licenceFor,
  licenceLength: length
})

describe('recurringPayReminderDisplay', () => {
  it.each([
    ['Email', 'we will send you an email showing the cost before the next payment is taken'],
    ['Letter', 'we will send you a letter showing the cost before the next payment is taken'],
    ['Text', 'we will send you a text message showing the cost before the next payment is taken']
  ])('when reminder is %s, recurringPayReminderDisplay will return "%s"', (reminder, expected) => {
    const permission = getPermission({ reminder })
    const result = recurringPayReminderDisplay(permission, getCatalog())
    expect(result).toEqual(expected)
  })
})

describe('validForRecurringPayment', () => {
  it.each([
    [true, '12M', true, true, 'not telesales', 18],
    [false, '8D', true, true, 'not telesales', 18],
    [false, '12M', false, true, 'not telesales', 18],
    [false, '12M', true, false, 'not telesales', 18],
    [false, '12M', true, true, 'telesales', 18],
    [false, '12M', true, true, 'not telesales', 16],
    [false, '12M', true, true, 'not telesales', 17]
  ])(
    'should return %s as licence length is %s, licence for you is %s and SHOW_RECURRING_PAYMENTS is %s and journey is %s and age is %s',
    (expected, length, licenceFor, recurring, telesales, age) => {
      process.env.CHANNEL = telesales
      process.env.SHOW_RECURRING_PAYMENTS = recurring
      const permission = getPermission({ reminder: 'Email', licenceFor, length, age })
      const result = validForRecurringPayment(permission)
      expect(result).toEqual(expected)
    }
  )
})
