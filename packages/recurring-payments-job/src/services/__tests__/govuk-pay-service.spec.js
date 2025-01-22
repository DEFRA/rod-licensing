import { getPaymentStatus, sendPayment } from '../govuk-pay-service.js'
import { govUkPayApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib')

describe('govuk-pay-service', () => {
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
    it('should call fetchPaymentStatus with payment id and true value for recurring payment', async () => {
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

    it('should throw an error if the response is not ok', async () => {
      govUkPayApi.fetchPaymentStatus.mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Payment not found' })
      })
      const paymentId = 'invalid-payment-id'
      await expect(getPaymentStatus(paymentId)).rejects.toThrow('Payment not found')
    })

    it('should throw an error if JSON parsing fails', async () => {
      govUkPayApi.fetchPaymentStatus.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Failed to parse JSON'))
      })
      const paymentId = 'valid-payment-id'
      await expect(getPaymentStatus(paymentId)).rejects.toThrow('Failed to parse JSON')
    })

    it('should handle invalid payment ID gracefully', async () => {
      const paymentId = null
      await expect(getPaymentStatus(paymentId)).rejects.toThrow('Invalid payment ID')
    })
  })
})
