import mockTransaction from './data/mock-transaction.js'
import { preparePayment } from '../../../processors/payment.js'
import { AGREED } from '../../../uri.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { sendRecurringPayment } from '../govuk-pay-service.js'
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
              licence_type_radio_trout_three_rod: 'Trout and coarse, up to 3 rods'
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
              licence_type_radio_trout_three_rod: 'Trout and coarse, up to 3 rods'
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
              licence_type_radio_salmon: 'Salmon and sea trout',
              licence_type_12m: '12 months'
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
      description: 'Salmon and sea trout (Over 66), 12 months',
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
              licence_type_radio_salmon: 'Salmon and sea trout',
              licence_type_8d: '8 days'
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
      description: 'Salmon and sea trout (Over 66), 8 days',
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
      govUkPayApi.createRecurringPayment.mockResolvedValue(mockResponse)
      const unique = Symbol('payload')
      const payload = {
        reference: 'd81f1a2b-6508-468f-8342-b6770f60f7cd',
        description: 'Fishing permission',
        user_identifier: '1218c1c5-38e4-4bf3-81ea-9cbce3994d30',
        unique
      }
      await sendRecurringPayment(payload)
      expect(govUkPayApi.createRecurringPayment).toHaveBeenCalledWith(payload)
    })

    it('should return response body when payment creation is successful', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      }
      govUkPayApi.createRecurringPayment.mockResolvedValue(mockResponse)

      const result = await sendRecurringPayment(preparedPayment)

      expect(result).toEqual({ success: true, paymentId: 'abc123' })
    })

    it('should log debug message when response.ok is true', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      }
      govUkPayApi.createRecurringPayment.mockResolvedValue(mockResponse)

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
      govUkPayApi.createRecurringPayment.mockResolvedValue(mockResponse)

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
      govUkPayApi.createRecurringPayment.mockRejectedValue(mockError)

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
      govUkPayApi.createRecurringPayment.mockResolvedValue(mockResponse)

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
      govUkPayApi.createRecurringPayment.mockResolvedValue(mockResponse)

      try {
        await sendRecurringPayment(preparedPayment)
      } catch (error) {
        expect(error.message).toBe('Unexpected response from GOV.UK pay API')
      }
    })
  })
})
