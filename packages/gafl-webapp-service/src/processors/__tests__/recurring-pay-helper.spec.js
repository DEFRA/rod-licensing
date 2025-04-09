import { isRecurringPayment, recurringPayReminderDisplay, validForRecurringPayment } from '../recurring-pay-helper.js'

const getCatalog = () => ({
  recurring_payment_set_up_bulletpoint_5_email: 'we will send you an email showing the cost before the next payment is taken',
  recurring_payment_set_up_bulletpoint_5_letter: 'we will send you a letter showing the cost before the next payment is taken',
  recurring_payment_set_up_bulletpoint_5_text: 'we will send you a text message showing the cost before the next payment is taken'
})

const getPermission = ({ reminder, licenceFor, length, birthDate }) => ({
  licensee: {
    preferredMethodOfReminder: reminder,
    birthDate
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
  test.each`
    expected | length   | licenceFor | recurring | telesales          | birthDate
    ${true}  | ${'12M'} | ${true}    | ${true}   | ${'not telesales'} | ${'1946-01-01'}
    ${false} | ${'8D'}  | ${true}    | ${true}   | ${'not telesales'} | ${'1946-01-01'}
    ${false} | ${'12M'} | ${false}   | ${true}   | ${'not telesales'} | ${'1946-01-01'}
    ${false} | ${'12M'} | ${true}    | ${false}  | ${'not telesales'} | ${'1946-01-01'}
    ${false} | ${'12M'} | ${true}    | ${true}   | ${'telesales'}     | ${'1946-01-01'}
    ${false} | ${'12M'} | ${true}    | ${true}   | ${'not telesales'} | ${'2010-01-01'}
  `(
    'should return %s as licence length is %s, licence for you is %s, SHOW_RECURRING_PAYMENTS is %s, journey is %s, and birthDate is %s',
    ({ expected, length, licenceFor, recurring, telesales, birthDate }) => {
      process.env.CHANNEL = telesales
      process.env.SHOW_RECURRING_PAYMENTS = recurring
      const permission = getPermission({ licenceFor, length, birthDate })
      const result = validForRecurringPayment(permission)
      expect(result).toEqual(expected)
    }
  )
})

describe('isRecurringPayment', () => {
  it.each`
    agreementId  | expected
    ${'foo123'}  | ${true}
    ${undefined} | ${false}
  `('recurringPayment returns $expected when transaction agreementId is $agreementId', async ({ show, agreementId, expected }) => {
    process.env.SHOW_RECURRING_PAYMENTS = show
    const transaction = { agreementId }

    expect(isRecurringPayment(transaction)).toBe(expected)

    delete process.env.SHOW_RECURRING_PAYMENTS
  })
})
