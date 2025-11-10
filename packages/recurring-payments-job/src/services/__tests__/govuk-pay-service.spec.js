import { getPaymentStatus, sendPayment, isGovPayUp } from '../govuk-pay-service.js'
import { govUkPayApi } from '@defra-fish/connectors-lib'
import db from 'debug'

jest.mock('@defra-fish/connectors-lib')
jest.mock('debug', () => jest.fn(() => jest.fn()))
const mockDebug = db.mock.results[0].value

describe('govuk-pay-service', () => {
  it('initialises logger', () => {
    expect(db).toHaveBeenCalledWith('recurring-payments:gov.uk-pay-service')
  })

  describe('sendPayment', () => {
    const preparedPayment = { id: '1234' }

    it('sendPayment should return response from createPayment in json format', async () => {
      const mockPreparedPayment = { id: 'test-payment-id' }
      const mockResponse = { state: { status: 'created' }, payment_id: 'abcde12345' }

      const mockFetchResponse = {
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      }
      govUkPayApi.createPayment.mockResolvedValue(mockFetchResponse)

      const result = await sendPayment(mockPreparedPayment)

      expect(result).toEqual(mockResponse)
    })

    it('should send provided payload data to Gov.UK Pay', async () => {
      govUkPayApi.createPayment.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      })
      const unique = Symbol('payload')
      const payload = {
        amount: '100',
        description: 'The recurring card payment for your rod fishing licence',
        reference: unique
      }
      sendPayment(payload)
      expect(govUkPayApi.createPayment).toHaveBeenCalledWith(payload, true)
    })

    it('should throw an error when the GOV.UK Pay connector raises an error', async () => {
      govUkPayApi.createPayment.mockImplementationOnce(() => {
        throw new Error('Oops!')
      })

      try {
        await sendPayment(preparedPayment)
      } catch (e) {
        expect(e.message).toBe('Oops!')
      }
    })

    it('should throw an error when response is not ok', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          code: 'P0102',
          field: 'agreement_id',
          description: 'Invalid attribute value: agreement_id. Agreement does not exist'
        })
      }
      govUkPayApi.createPayment.mockResolvedValueOnce(mockFetchResponse)

      await expect(
        sendPayment({
          amount: 100,
          description: 'The recurring card payment for your rod fishing licence',
          id: 'a50f0d51-295f-42b3-98f8-97c0641ede5a',
          authorisation_mode: 'agreement',
          agreement_id: 'does_not_exist'
        })
      ).rejects.toThrow('Unexpected response from GOV.UK Pay API')
    })
  })

  describe('getPaymentStatus', () => {
    it('should call fetchPaymentStatus with payment id and true for recurring payments', async () => {
      govUkPayApi.fetchPaymentStatus.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ code: 'P1234', description: 'Success' })
      })
      const paymentId = Symbol('transactionId')
      await getPaymentStatus(paymentId)
      expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentId, true)
    })

    it('should return the payment status on successful response', async () => {
      const mockPaymentStatus = { amount: 37.5, state: { status: 'success', finished: 'true' } }
      govUkPayApi.fetchPaymentStatus.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockPaymentStatus)
      })
      const paymentId = 'valid-payment-id'
      const result = await getPaymentStatus(paymentId)
      expect(result).toEqual(mockPaymentStatus)
    })

    it('should throw an error when payment ID is not provided', async () => {
      await expect(getPaymentStatus(null)).rejects.toThrow('Invalid payment ID')
    })

    it('should throw an error when response is not ok', async () => {
      const mockFetchResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({
          code: 'P0200',
          field: 'payment_id',
          description: 'No payment matched the payment id you provided'
        })
      }
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(mockFetchResponse)

      await expect(getPaymentStatus('invalid-payment-id')).rejects.toThrow('Unexpected response from GOV.UK Pay API')
    })

    it('should log details when response is not ok', async () => {
      const serviceResponseBody = {
        code: 'P0200',
        field: 'payment_id',
        description: 'No payment matched the payment id you provided'
      }
      const mockFetchResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue(serviceResponseBody)
      }
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(mockFetchResponse)
      jest.spyOn(console, 'error')
      const paymentId = 'invalid-payment-id'

      try {
        await getPaymentStatus(paymentId)
      } catch {}

      expect(console.error).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          status: mockFetchResponse.status,
          response: serviceResponseBody,
          paymentId
        })
      )
    })

    it('should throw an error when fetchPaymentStatus fails', async () => {
      const mockError = new Error('Network error')
      govUkPayApi.fetchPaymentStatus.mockRejectedValue(mockError)

      await expect(getPaymentStatus('test-payment-id')).rejects.toThrow('Network error')
    })
  })

  describe('isGovPayUp', () => {
    it.each([
      [true, 'true', 'true'],
      [false, 'true', 'false'],
      [false, 'false', 'true'],
      [false, 'false', 'false']
    ])('resolves to %p if healthy is %s and deadlocks is %s', async (expectedResult, pingHealthy, deadlocksHealthy) => {
      govUkPayApi.isGovPayUp.mockResolvedValueOnce({
        ok: true,
        text: async () => `{"ping":{"healthy":${pingHealthy}},"deadlocks":{"healthy":${deadlocksHealthy}}}`
      })
      expect(await isGovPayUp()).toBe(expectedResult)
    })

    it("resolves to false if we don't receive a 2xx response", async () => {
      govUkPayApi.isGovPayUp.mockResolvedValueOnce({
        ok: false
      })
      expect(await isGovPayUp()).toBe(false)
    })

    it("logs if we don't receive a 2xx response", async () => {
      govUkPayApi.isGovPayUp.mockResolvedValueOnce({
        ok: false
      })
      await isGovPayUp()
      expect(mockDebug).toHaveBeenCalledWith('Health endpoint unavailable')
    })
  })
})
