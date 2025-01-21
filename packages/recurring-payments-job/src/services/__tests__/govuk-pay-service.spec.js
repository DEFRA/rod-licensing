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
        json: jest.fn().mockResolvedValue({ status: 'success' })
      })
      const paymentId = Symbol('transactionId')
      await getPaymentStatus(paymentId)
      expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentId, true)
    })
  })
})
