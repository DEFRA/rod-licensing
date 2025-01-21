import { getPaymentStatus, sendPayment } from '../govuk-pay-service.js'
import { govUkPayApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib')

describe('govuk-pay-service', () => {
  describe('sendPayment', () => {
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
