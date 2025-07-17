import mockTransaction from './data/mock-transaction.js'
import { preparePayment } from '../../../processors/payment.js'
import { AGREED } from '../../../uri.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { sendPayment, sendRecurringPayment, getPaymentStatus } from '../govuk-pay-service.js'
import { govUkPayApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:govuk-pay-service')]

jest.mock('debug', () => jest.fn(() => jest.fn()))
jest.mock('@defra-fish/connectors-lib')
jest.mock('../../../processors/uri-helper.js')

describe('The govuk-pay-service', () => {
  it('prepares a correct payment response endpoint for http', async () => {
    addLanguageCodeToUri.mockReturnValue('http://0.0.0.0:3000/buy/agreed')

    expect(
      preparePayment(
        {
          i18n: {
            getCatalog: () => ({
              over_66: 'Over 66',
              licence_type_radio_trout_three_rod_payment_summary: 'trout and coarse (up to 3 rods)'
            })
          },
          info: { host: '0.0.0.0:3000' },
          headers: { 'x-forwarded-proto': 'http' }
        },
        mockTransaction
      ).return_url
    ).toEqual('http://0.0.0.0:3000' + AGREED.uri)
  })

  it('prepares a correct payment response endpoint for https', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    expect(
      preparePayment(
        {
          i18n: {
            getCatalog: () => ({
              over_66: 'Over 66',
              licence_type_radio_trout_three_rod_payment_summary: 'trout and coarse (up to 3 rods)'
            })
          },
          info: { host: '0.0.0.0:3000' },
          headers: { 'x-forwarded-proto': 'https' }
        },
        mockTransaction
      ).return_url
    ).toEqual('https://0.0.0.0:3000' + AGREED.uri)
  })

  it('prepares a correct payment creation object', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    expect(
      preparePayment(
        {
          i18n: {
            getCatalog: () => ({
              over_66: ' (Over 66)',
              licence_type_radio_salmon_payment_summary: 'salmon and sea trout',
              licence_12_month: '12-month'
            })
          },
          info: { host: '0.0.0.0:3000' },
          headers: {},
          server: { info: { protocol: 'https' } }
        },
        mockTransaction
      )
    ).toEqual({
      amount: 5400,
      delayed_capture: false,
      description: '12-month salmon and sea trout (Over 66)',
      email: 'angling@email.com',
      reference: '44728b47-c809-4c31-8c92-bdf961be0c80',
      return_url: 'https://0.0.0.0:3000' + AGREED.uri,
      moto: false,
      language: 'en',
      prefilled_cardholder_details: {
        cardholder_name: 'Graham Willis',
        billing_address: {
          city: 'BRISTOL',
          country: 'GB',
          line1: '11 HOWECROFT COURT EASTMEAD LANE',
          postcode: 'BS9 1HJ'
        }
      }
    })
  })

  it('prepares a correct payment creation object - with locality', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    const mockTransaction2 = Object.assign({}, mockTransaction)
    mockTransaction2.permissions[0].licensee.locality = 'Stoke Bishop'
    mockTransaction2.permissions[0].licenceLength = '8D'
    expect(
      preparePayment(
        {
          i18n: {
            getCatalog: () => ({
              over_66: ' (Over 66)',
              licence_type_radio_salmon_payment_summary: 'salmon and sea trout',
              licence_8_day: '8-day'
            })
          },
          info: { host: '0.0.0.0:3000' },
          headers: { 'x-forwarded-proto': 'https' }
        },
        mockTransaction2
      )
    ).toEqual({
      amount: 5400,
      delayed_capture: false,
      description: '8-day salmon and sea trout (Over 66)',
      email: 'angling@email.com',
      reference: '44728b47-c809-4c31-8c92-bdf961be0c80',
      return_url: 'https://0.0.0.0:3000' + AGREED.uri,
      moto: false,
      language: 'en',
      prefilled_cardholder_details: {
        cardholder_name: 'Graham Willis',
        billing_address: {
          city: 'BRISTOL',
          country: 'GB',
          line1: '11 HOWECROFT COURT EASTMEAD LANE',
          line2: 'Stoke Bishop',
          postcode: 'BS9 1HJ'
        }
      }
    })
  })

  it('prepares a correct payment creation object where there are multiple licences', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    const newMockTransaction = Object.assign({}, mockTransaction)
    newMockTransaction.permissions.push(mockTransaction.permissions[0])
    expect(preparePayment({ info: { host: '0.0.0.0:3000' }, headers: { 'x-forwarded-proto': 'https' } }, newMockTransaction)).toEqual({
      amount: 5400,
      delayed_capture: false,
      description: 'Multiple permits',
      reference: '44728b47-c809-4c31-8c92-bdf961be0c80',
      return_url: 'https://0.0.0.0:3000' + AGREED.uri,
      moto: false,
      language: 'en'
    })
  })

  it('posts the prepared payment to the GOV.PAY api', async () => {
    addLanguageCodeToUri.mockReturnValue('https://0.0.0.0:3000/buy/agreed')

    const preparedPayment = preparePayment({ info: { host: '0.0.0.0:3000' }, headers: { 'x-forwarded-proto': 'https' } }, mockTransaction)
    console.log(preparedPayment)
  })

  describe('sendPayment', () => {
    const preparedPayment = {
      id: '1234',
      user_identifier: 'test-user'
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it.each([
      [true, true],
      [false, false],
      [false, undefined]
    ])('should call the govUkPayApi with recurring as %s if the argument is %s', async (expected, value) => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      }
      govUkPayApi.createPayment.mockResolvedValue(mockResponse)
      const unique = Symbol('payload')
      const payload = { unique }
      await sendPayment(payload, value)
      expect(govUkPayApi.createPayment).toHaveBeenCalledWith(payload, expected)
    })

    it('should send provided payload data to Gov.UK Pay', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      }
      govUkPayApi.createPayment.mockResolvedValue(mockResponse)
      const unique = Symbol('payload')
      const payload = {
        reference: 'd81f1a2b-6508-468f-8342-b6770f60f7cd',
        description: 'Fishing permission',
        user_identifier: '1218c1c5-38e4-4bf3-81ea-9cbce3994d30',
        unique
      }
      await sendPayment(payload)
      expect(govUkPayApi.createPayment).toHaveBeenCalledWith(payload, false)
    })

    it('should return response body when payment creation is successful', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      }
      govUkPayApi.createPayment.mockResolvedValue(mockResponse)

      const result = await sendPayment(preparedPayment)

      expect(result).toEqual({ success: true, paymentId: 'abc123' })
    })

    it('should log debug message when response.ok is true', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      }
      govUkPayApi.createPayment.mockResolvedValue(mockResponse)

      await sendPayment(preparedPayment)

      expect(debug).toHaveBeenCalledWith('Successful payment creation response: %o', { success: true, paymentId: 'abc123' })
    })

    it('should log error message when response.ok is false', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      }
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      govUkPayApi.createPayment.mockResolvedValue(mockResponse)

      try {
        await sendPayment(preparedPayment)
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failure creating payment in the GOV.UK API service', {
          transactionId: preparedPayment.id,
          method: 'POST',
          payload: preparedPayment,
          status: mockResponse.status,
          response: { message: 'Server error' }
        })
      }
    })

    it('should throw error when API call fails with network issue', async () => {
      const mockError = new Error('Network error')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      govUkPayApi.createPayment.mockRejectedValue(mockError)

      try {
        await sendPayment(preparedPayment)
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          `Error creating payment in the GOV.UK API service - tid: ${preparedPayment.id}`,
          mockError
        )
      }
    })

    it('should throw error for when rate limit is breached', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({ message: 'Rate limit exceeded' })
      }
      const consoleErrorSpy = jest.spyOn(console, 'info').mockImplementation(jest.fn())
      govUkPayApi.createPayment.mockResolvedValue(mockResponse)

      try {
        await sendPayment(preparedPayment)
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(`GOV.UK Pay API rate limit breach - tid: ${preparedPayment.id}`)
      }
    })

    it('should throw error for unexpected response status', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      }
      govUkPayApi.createPayment.mockResolvedValue(mockResponse)

      try {
        await sendPayment(preparedPayment)
      } catch (error) {
        expect(error.message).toBe('Unexpected response from GOV.UK pay API')
      }
    })
  })

  describe('sendRecurringPayment', () => {
    const preparedPayment = {
      id: '1234',
      user_identifier: 'test-user'
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should send provided payload data to Gov.UK Pay', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      }
      govUkPayApi.createRecurringPaymentAgreement.mockResolvedValue(mockResponse)
      const unique = Symbol('payload')
      const payload = {
        reference: 'd81f1a2b-6508-468f-8342-b6770f60f7cd',
        description: 'Fishing permission',
        user_identifier: '1218c1c5-38e4-4bf3-81ea-9cbce3994d30',
        unique
      }
      await sendRecurringPayment(payload)
      expect(govUkPayApi.createRecurringPaymentAgreement).toHaveBeenCalledWith(payload)
    })

    it('should return response body when payment creation is successful', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      }
      govUkPayApi.createRecurringPaymentAgreement.mockResolvedValue(mockResponse)

      const result = await sendRecurringPayment(preparedPayment)

      expect(result).toEqual({ success: true, paymentId: 'abc123' })
    })

    it('should log debug message when response.ok is true', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      }
      govUkPayApi.createRecurringPaymentAgreement.mockResolvedValue(mockResponse)

      await sendRecurringPayment(preparedPayment)

      expect(debug).toHaveBeenCalledWith('Successful agreement creation response: %o', { success: true, paymentId: 'abc123' })
    })

    it('should log error message  when response.ok is false', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      }
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      govUkPayApi.createRecurringPaymentAgreement.mockResolvedValue(mockResponse)

      try {
        await sendRecurringPayment(preparedPayment)
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failure creating agreement in the GOV.UK API service', {
          transactionId: preparedPayment.reference,
          method: 'POST',
          payload: preparedPayment,
          status: mockResponse.status,
          response: { message: 'Server error' }
        })
      }
    })

    it('should throw error when API call fails with network issue', async () => {
      const mockError = new Error('Network error')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      govUkPayApi.createRecurringPaymentAgreement.mockRejectedValue(mockError)

      try {
        await sendRecurringPayment(preparedPayment)
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          `Error creating agreement in the GOV.UK API service - tid: ${preparedPayment.user_identifier}`,
          mockError
        )
      }
    })

    it('should throw error for when rate limit is breached', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({ message: 'Rate limit exceeded' })
      }
      const consoleErrorSpy = jest.spyOn(console, 'info').mockImplementation(jest.fn())
      govUkPayApi.createRecurringPaymentAgreement.mockResolvedValue(mockResponse)

      try {
        await sendRecurringPayment(preparedPayment)
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(`GOV.UK Pay API rate limit breach - tid: ${preparedPayment.id}`)
      }
    })

    it('should throw error for unexpected response status', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      }
      govUkPayApi.createRecurringPaymentAgreement.mockResolvedValue(mockResponse)

      try {
        await sendRecurringPayment(preparedPayment)
      } catch (error) {
        expect(error.message).toBe('Unexpected response from GOV.UK pay API')
      }
    })
  })

  describe('getPaymentStatus', () => {
    const paymentId = '1234'

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it.each([
      [true, true],
      [false, false],
      [false, undefined]
    ])('should call the govUkPayApi with recurring as %s if the argument is %s', async (expected, value) => {
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(getMockFetchPaymentStatus())
      await getPaymentStatus(paymentId, value)
      expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentId, expected)
    })

    it('should send provided paymentId to Gov.UK Pay', async () => {
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(getMockFetchPaymentStatus())
      await getPaymentStatus(paymentId)
      expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentId, false)
    })

    it('should return response body when payment status check is successful', async () => {
      const resBody = { card_details: { foo: Symbol('foo') }, bar: Symbol('bar'), baz: Symbol('baz') }
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(getMockFetchPaymentStatus(resBody))

      const result = await getPaymentStatus(paymentId)

      expect(result).toEqual(resBody)
    })

    it('should log debug message when response.ok is true', async () => {
      const resBody = { card_details: { foo: Symbol('foo') }, bar: Symbol('bar'), baz: Symbol('baz') }
      // eslint-disable-next-line camelcase
      const { card_details, ...expectedLoggedOutput } = resBody
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(getMockFetchPaymentStatus(resBody))

      await getPaymentStatus(paymentId)

      expect(debug).toHaveBeenCalledWith('Payment status response: %o', expectedLoggedOutput)
    })

    it('should log error message when response.ok is false', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      }
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(mockResponse)

      try {
        await getPaymentStatus(paymentId)
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          `Error retrieving the payment status from the GOV.UK API service - tid: ${paymentId}`,
          {
            method: 'GET',
            paymentId: paymentId,
            status: mockResponse.status,
            response: { message: 'Server error' }
          }
        )
      }
    })

    it('should throw error when API call fails with network issue', async () => {
      const mockError = new Error('Network error')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      govUkPayApi.fetchPaymentStatus.mockRejectedValue(mockError)

      try {
        await getPaymentStatus(paymentId)
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          `Error retrieving the payment status from the GOV.UK API service - paymentId: ${paymentId}`,
          mockError
        )
      }
    })

    it('should throw error for when rate limit is breached', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({ message: 'Rate limit exceeded' })
      }
      const consoleErrorSpy = jest.spyOn(console, 'info').mockImplementation(jest.fn())
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(mockResponse)

      try {
        await getPaymentStatus(paymentId)
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith(`GOV.UK Pay API rate limit breach - paymentId: ${paymentId}`)
      }
    })

    it('should throw error for unexpected response status', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      }
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(mockResponse)

      try {
        await getPaymentStatus(paymentId)
      } catch (error) {
        expect(error.message).toBe('Unexpected response from GOV.UK pay API')
      }
    })
  })
})

const getMockFetchPaymentStatus = (resBody = { card_details: 'foo' }) => ({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue(resBody)
})
