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
      const mockResponse = { status: 'success', paymentId: 'abc123' }

      const mockFetchResponse = {
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

    it('should log error message when the GOV.UK Pay API raises an error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      govUkPayApi.createPayment.mockImplementationOnce(() => {
        throw new Error()
      })

      try {
        await sendPayment(preparedPayment)
      } catch (error) {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating payment', preparedPayment.id)
      }
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
      const mockPaymentStatus = { code: 'P1234', description: 'Success' }
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
      const mockErrorDetails = { error: 'Payment not found' }
      const mockFetchResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue(mockErrorDetails)
      }
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(mockFetchResponse)

      await expect(getPaymentStatus('invalid-payment-id')).rejects.toThrow('Payment not found')
    })

    it('should throw an error when response is not ok but errorDetails has no value', async () => {
      const mockErrorDetails = {}
      const mockFetchResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue(mockErrorDetails)
      }
      govUkPayApi.fetchPaymentStatus.mockResolvedValue(mockFetchResponse)

      await expect(getPaymentStatus('invalid-payment-id')).rejects.toThrow('Error fetching payment status')
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
