import { isGovPayUp, queueRecurringPayment, queueRecurringPaymentStatusCheck } from '../govuk-pay-service.js'
import { govUkPayApi } from '@defra-fish/connectors-lib'
import db from 'debug'

jest.mock('@defra-fish/connectors-lib')
jest.mock('debug', () => jest.fn(() => jest.fn()))
const mockDebug = db.mock.results[0].value

describe('govuk-pay-service', () => {
  it('initialises logger', () => {
    expect(db).toHaveBeenCalledWith('recurring-payments:gov.uk-pay-service')
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

  it('should call govUkPayApi.queueRecurringPayment with the provided preparedPayment and batcher', () => {
    const preparedPayment = Symbol('preparedPayment')
    const batcher = Symbol('batcher')
    queueRecurringPayment(preparedPayment, batcher)
    expect(govUkPayApi.queueRecurringPayment).toHaveBeenCalledWith(preparedPayment, batcher)
  })

  it('should call govUkPayApi.queueRecurringPaymentStatusCheck with the provided payment and batcher', () => {
    const paymentId = Symbol('payment')
    const batcher = Symbol('batcher')
    queueRecurringPaymentStatusCheck(paymentId, batcher)
    expect(govUkPayApi.queueRecurringPaymentStatusCheck).toHaveBeenCalledWith(paymentId, batcher)
  })
})
