import db from 'debug'
import { govUkPayApi } from '@defra-fish/connectors-lib'
// import { getRecurringPaymentAgreement } from '../test-debug.js'
import { getRecurringPaymentAgreement } from '../recurring-payments.service.js'

jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'sales:recurring')]

jest.mock('@defra-fish/connectors-lib', () => ({
  govUkPayApi: {
    getRecurringPaymentAgreementInformation: jest.fn()
  }
}))

global.structuredClone = obj => JSON.parse(JSON.stringify(obj))

it.only('debug should output message when response.ok is true without card details', async () => {
  const agreementId = '1234'
  const mockResponse = {
    ok: true,
    json: jest.fn().mockResolvedValue({ success: true, payment_instrument: { card_details: { last_digits_card_number: '1234' } } })
  }
  govUkPayApi.getRecurringPaymentAgreementInformation.mockResolvedValue(mockResponse)
  await getRecurringPaymentAgreement(agreementId)
  expect(debug).toHaveBeenCalledWith(
    'Successfully got recurring payment agreement information: %o',
    { success: true, payment_instrument: {} }
  )
})
