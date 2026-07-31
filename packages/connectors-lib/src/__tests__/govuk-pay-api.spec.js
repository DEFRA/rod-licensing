import * as govUkPayApi from '../govuk-pay-api.js'
jest.mock('node-fetch')
const fetch = require('node-fetch')

process.env.GOV_PAY_API_URL = 'http://0.0.0.0/payment'
process.env.GOV_PAY_RCP_API_URL = 'http://0.0.0.0/agreement'
process.env.GOV_PAY_APIKEY = 'key'
process.env.GOV_PAY_RECURRING_APIKEY = 'recurringkey'

const headers = {
  accept: 'application/json',
  authorization: `Bearer ${process.env.GOV_PAY_APIKEY}`,
  'content-type': 'application/json'
}

const recurringHeaders = () => ({
  accept: 'application/json',
  authorization: `Bearer ${process.env.GOV_PAY_RECURRING_APIKEY}`,
  'content-type': 'application/json'
})

describe('govuk-pay-api-connector', () => {
  beforeEach(jest.clearAllMocks)

  describe('createPayment', () => {
    it('creates new payments', async () => {
      fetch.mockReturnValueOnce({ ok: true, status: 200 })
      await expect(govUkPayApi.createPayment({ cost: 0 })).resolves.toEqual({ ok: true, status: 200 })
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment', {
        body: JSON.stringify({ cost: 0 }),
        headers,
        method: 'post',
        timeout: 10000
      })
    })

    it('logs and throws errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockImplementationOnce(() => {
        throw new Error('')
      })
      await expect(govUkPayApi.createPayment({ cost: 0 })).rejects.toEqual(Error(''))
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment', {
        body: JSON.stringify({ cost: 0 }),
        headers,
        method: 'post',
        timeout: 10000
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('uses the correct API key if recurring arg is set to true', async () => {
      fetch.mockReturnValueOnce({ ok: true, status: 200 })
      await expect(govUkPayApi.createPayment({ cost: 0 }, true)).resolves.toEqual({ ok: true, status: 200 })
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment', {
        body: JSON.stringify({ cost: 0 }),
        headers: recurringHeaders(),
        method: 'post',
        timeout: 10000
      })
    })

    it('rethrows the same error when fetch rejects', async () => {
      const error = new Error('creating payment failed')
      fetch.mockRejectedValueOnce(error)
      await expect(govUkPayApi.createPayment('abc-123')).rejects.toBe(error)
    })

    it('logs an error when fetch rejects', async () => {
      const error = new Error('creating payment failed')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockRejectedValueOnce(error)
      await govUkPayApi.createPayment('abc-123').catch(() => {})
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating payment in the GOV.UK API service - payment: "abc-123"', error)
    })
  })

  describe('fetchPaymentStatus', () => {
    it('retrieves payment status', async () => {
      fetch.mockReturnValueOnce({ ok: true, status: 200, json: () => {} })
      await expect(govUkPayApi.fetchPaymentStatus(123)).resolves.toEqual(expect.objectContaining({ ok: true, status: 200 }))
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment/123', {
        headers,
        method: 'get',
        timeout: 10000
      })
    })

    it('logs and throws errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockImplementationOnce(() => {
        throw new Error('')
      })
      await expect(govUkPayApi.fetchPaymentStatus(123)).rejects.toEqual(Error(''))
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment/123', { headers, method: 'get', timeout: 10000 })
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('uses the correct API key if recurring arg is set to true', async () => {
      fetch.mockReturnValueOnce({ ok: true, status: 200, json: () => {} })
      await expect(govUkPayApi.fetchPaymentStatus(123, true)).resolves.toEqual(expect.objectContaining({ ok: true, status: 200 }))
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment/123', {
        headers: recurringHeaders(),
        method: 'get',
        timeout: 10000
      })
    })

    it('rethrows the same error when fetch rejects', async () => {
      const error = new Error('fetching payment status failed')
      fetch.mockRejectedValueOnce(error)
      await expect(govUkPayApi.fetchPaymentStatus('abc-123')).rejects.toBe(error)
    })

    it('logs an error when fetch rejects', async () => {
      const error = new Error('fetching payment status failed')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockRejectedValueOnce(error)
      await govUkPayApi.fetchPaymentStatus('abc-123').catch(() => {})
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error retrieving the payment status from the GOV.UK API service - paymentId: abc-123',
        error
      )
    })
  })

  describe('fetchPaymentEvents', () => {
    it('retrieves payment events', async () => {
      fetch.mockReturnValueOnce({ ok: true, status: 200, json: () => {} })
      await expect(govUkPayApi.fetchPaymentEvents(123)).resolves.toEqual(expect.objectContaining({ ok: true, status: 200 }))
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment/123/events', { headers, method: 'get', timeout: 10000 })
    })

    it('logs and throws errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockImplementationOnce(() => {
        throw new Error('test event error')
      })
      await expect(govUkPayApi.fetchPaymentEvents(123)).rejects.toEqual(Error('test event error'))
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('uses the correct API key if recurring arg is set to true', async () => {
      fetch.mockReturnValueOnce({ ok: true, status: 200, json: () => {} })
      await expect(govUkPayApi.fetchPaymentEvents(123, true)).resolves.toEqual(expect.objectContaining({ ok: true, status: 200 }))
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment/123/events', {
        headers: recurringHeaders(),
        method: 'get',
        timeout: 10000
      })
    })

    it('rethrows the same error when fetch rejects', async () => {
      const error = new Error('fetching payments failed')
      fetch.mockRejectedValueOnce(error)
      await expect(govUkPayApi.fetchPaymentEvents('abc-123')).rejects.toBe(error)
    })

    it('logs an error when fetch rejects', async () => {
      const error = new Error('fetching payments failed')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockRejectedValueOnce(error)
      await govUkPayApi.fetchPaymentEvents('abc-123').catch(() => {})
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error retrieving the payment events from the GOV.UK API service - paymentId: abc-123',
        error
      )
    })
  })

  describe('createRecurringPaymentAgreement', () => {
    it('creates new payments', async () => {
      fetch.mockReturnValueOnce({ ok: true, status: 200 })
      await expect(govUkPayApi.createRecurringPaymentAgreement({ cost: 0 })).resolves.toEqual({ ok: true, status: 200 })
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/agreement', {
        body: JSON.stringify({ cost: 0 }),
        headers: recurringHeaders(),
        method: 'post',
        timeout: 10000
      })
    })

    it('logs and throws errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockImplementationOnce(() => {
        throw new Error('')
      })
      await expect(govUkPayApi.createRecurringPaymentAgreement({ reference: '123' })).rejects.toEqual(Error(''))
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/agreement', {
        body: JSON.stringify({ reference: '123' }),
        headers: recurringHeaders(),
        method: 'post',
        timeout: 10000
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('isGovPayUp', () => {
    it.each(['http://gov.uk.pay/health/check/url', 'https://gov-uk-pay?health-check-url'])(
      'calls healthy endpoint %s',
      async healthCheckURL => {
        process.env.GOV_PAY_HEALTH_CHECK_URL = healthCheckURL
        await govUkPayApi.isGovPayUp()
        expect(fetch).toHaveBeenCalledWith(healthCheckURL)
      }
    )

    it('returns the fetch response', async () => {
      const response = Symbol('response')
      fetch.mockReturnValueOnce(response)
      expect(await govUkPayApi.isGovPayUp()).toBe(response)
    })

    it('throws errors that are thrown by fetch', async () => {
      const error = new Error('Fail')
      fetch.mockImplementationOnce(() => {
        throw error
      })
      await expect(govUkPayApi.isGovPayUp()).rejects.toBe(error)
    })

    it('logs errors', async () => {
      const error = new Error('Fail')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockImplementationOnce(() => {
        throw error
      })
      try {
        await govUkPayApi.isGovPayUp()
      } catch {}
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error retrieving GovPay health status', error)
    })

    it('rethrows the same error when fetch rejects', async () => {
      const error = new Error('fetching GovPay health status failed')
      fetch.mockRejectedValueOnce(error)
      await expect(govUkPayApi.isGovPayUp()).rejects.toBe(error)
    })

    it('logs an error when fetch rejects', async () => {
      const error = new Error('fetching GovPay health status failed')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockRejectedValueOnce(error)
      await govUkPayApi.isGovPayUp().catch(() => {})
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error retrieving GovPay health status', error)
    })
  })

  describe('getRecurringPaymentAgreementInformation', () => {
    it('retrieves recurring payment agreement information', async () => {
      const mockResponse = { ok: true, status: 200, json: () => {} }
      fetch.mockResolvedValueOnce(mockResponse)
      await expect(govUkPayApi.getRecurringPaymentAgreementInformation(123)).resolves.toEqual(
        expect.objectContaining({ ok: true, status: 200 })
      )
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/agreement/123', { headers: recurringHeaders(), method: 'get', timeout: 10000 })
    })

    it('logs and throws errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockImplementation(() => {
        throw new Error('test event error')
      })
      await expect(govUkPayApi.getRecurringPaymentAgreementInformation(123)).rejects.toEqual(Error('test event error'))
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('rethrows the same error when fetch rejects', async () => {
      const error = new Error('fetching agreement failed')
      fetch.mockRejectedValueOnce(error)
      await expect(govUkPayApi.getRecurringPaymentAgreementInformation('abc-123')).rejects.toBe(error)
    })

    it('logs an error when fetch rejects', async () => {
      const error = new Error('fetching agreement failed')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockRejectedValueOnce(error)
      await govUkPayApi.getRecurringPaymentAgreementInformation('abc-123').catch(() => {})
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching recurring payment agreement information in the GOV.UK API service - agreementId: abc-123',
        error
      )
    })
  })

  describe('cancelRecurringPaymentAgreement', () => {
    it('calls the cancel endpoint for the provided agreement id', async () => {
      const mockResponse = { ok: true, status: 204 }
      fetch.mockReturnValueOnce(mockResponse)
      await govUkPayApi.cancelRecurringPaymentAgreement('abc-123')
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/agreement/abc-123/cancel', expect.any(Object))
    })

    it('sends recurring API headers', async () => {
      const mockResponse = { ok: true, status: 204 }
      fetch.mockResolvedValueOnce(mockResponse)
      await govUkPayApi.cancelRecurringPaymentAgreement('abc-123')
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: recurringHeaders()
        })
      )
    })

    it('uses POST method', async () => {
      const mockResponse = { ok: true, status: 204 }
      fetch.mockResolvedValueOnce(mockResponse)
      await govUkPayApi.cancelRecurringPaymentAgreement('abc-123')
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'post'
        })
      )
    })

    it('uses the configured request timeout', async () => {
      const mockResponse = { ok: true, status: 204 }
      fetch.mockResolvedValueOnce(mockResponse)
      await govUkPayApi.cancelRecurringPaymentAgreement('abc-123')
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 10000
        })
      )
    })

    it('returns the fetch response when GOV.UK Pay request succeeds', async () => {
      const mockResponse = { ok: true, status: 204 }
      fetch.mockResolvedValueOnce(mockResponse)
      const result = await govUkPayApi.cancelRecurringPaymentAgreement('abc-123')
      expect(result).toEqual({ ok: true, status: 204 })
    })

    it('returns non-ok responses for caller-side handling', async () => {
      const mockResponse = { ok: false, status: 400, statusText: 'Bad Request' }
      fetch.mockResolvedValueOnce(mockResponse)
      const result = await govUkPayApi.cancelRecurringPaymentAgreement('abc-123')
      expect(result).toEqual(mockResponse)
    })

    it('logs and rethrows errors when fetch rejects', async () => {
      const error = new Error('cancel agreement failed')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockRejectedValueOnce(error)

      await expect(govUkPayApi.cancelRecurringPaymentAgreement('abc-123')).rejects.toBe(error)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error cancelling recurring payment agreement in the GOV.UK API service - agreementId: abc-123',
        error
      )
    })

    it('rethrows the same error when fetch rejects', async () => {
      const error = new Error('cancel agreement failed')
      fetch.mockRejectedValueOnce(error)

      await expect(govUkPayApi.cancelRecurringPaymentAgreement('abc-123')).rejects.toBe(error)
    })

    it('logs an error when fetch rejects', async () => {
      const error = new Error('cancel agreement failed')
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockRejectedValueOnce(error)

      await govUkPayApi.cancelRecurringPaymentAgreement('abc-123').catch(() => {})
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error cancelling recurring payment agreement in the GOV.UK API service - agreementId: abc-123',
        error
      )
    })
  })
})
