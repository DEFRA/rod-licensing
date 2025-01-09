import { sendPayment } from '../govuk-pay-service.js'
import { govUkPayApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib')

describe('govuk-pay-service', () => {
  const preparedPayment = { id: '1234' }

  describe('sendPayment', () => {
    it('should send provided payload data to Gov.UK Pay', async () => {
      govUkPayApi.createPayment.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, paymentId: 'abc123' })
      })
      const unique = Symbol('payload')
      const payload = {
        amount: '100',
        description: 'Recurring payment',
        reference: unique
      }
      await sendPayment(payload)
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
})
