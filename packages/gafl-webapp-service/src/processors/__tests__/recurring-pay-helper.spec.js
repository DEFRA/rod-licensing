import moment from 'moment'
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
    expected | length   | licenceFor | telesales          | age
    ${true}  | ${'12M'} | ${true}    | ${'not telesales'} | ${69}
    ${true}  | ${'12M'} | ${true}    | ${'not telesales'} | ${39}
    ${false} | ${'12M'} | ${true}    | ${'not telesales'} | ${15}
    ${false} | ${'8D'}  | ${true}    | ${'not telesales'} | ${69}
    ${false} | ${'1D'}  | ${true}    | ${'not telesales'} | ${69}
    ${false} | ${'12M'} | ${false}   | ${'not telesales'} | ${69}
    ${false} | ${'12M'} | ${true}    | ${'telesales'}     | ${69}
  `(
    'should return $expected as licence length is $length, licence for you is $licenceFor, journey is $telesales, and age is $age',
    ({ expected, length, licenceFor, telesales, age }) => {
      process.env.CHANNEL = telesales
      const birthDate = `${moment().subtract(age, 'years').format('YYYY')}-01-01`
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
  `('recurringPayment returns $expected when transaction agreementId is $agreementId', async ({ agreementId, expected }) => {
    const transaction = { agreementId }
    expect(isRecurringPayment(transaction)).toBe(expected)
  })
})
