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

const recurringHeaders = {
  accept: 'application/json',
  authorization: `Bearer ${process.env.GOV_PAY_RECURRING_APIKEY}`,
  'content-type': 'application/json'
}

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
      expect(govUkPayApi.createPayment({ cost: 0 })).rejects.toEqual(Error(''))
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
        headers: recurringHeaders,
        method: 'post',
        timeout: 10000
      })
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
        headers: recurringHeaders,
        method: 'get',
        timeout: 10000
      })
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
        headers: recurringHeaders,
        method: 'get',
        timeout: 10000
      })
    })
  })

  describe('createRecurringPaymentAgreement', () => {
    it('creates new payments', async () => {
      fetch.mockReturnValueOnce({ ok: true, status: 200 })
      await expect(govUkPayApi.createRecurringPaymentAgreement({ cost: 0 })).resolves.toEqual({ ok: true, status: 200 })
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/agreement', {
        body: JSON.stringify({ cost: 0 }),
        headers: recurringHeaders,
        method: 'post',
        timeout: 10000
      })
    })

    it('logs and throws errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockImplementationOnce(() => {
        throw new Error('')
      })
      expect(govUkPayApi.createRecurringPaymentAgreement({ reference: '123' })).rejects.toEqual(Error(''))
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/agreement', {
        body: JSON.stringify({ reference: '123' }),
        headers: recurringHeaders,
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
      const consoleErrorSpy = jest.spyOn(console, 'error')
      fetch.mockImplementationOnce(() => {
        throw error
      })
      try {
        await govUkPayApi.isGovPayUp()
      } catch {}
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error retrieving GovPay health status', error)
    })
  })
  
  describe('getRecurringPaymentAgreementInformation', () => {
    it('retrieves recurring payment agreement information', async () => {
      fetch.mockReturnValue({ ok: true, status: 200, json: () => {} })
      await expect(govUkPayApi.getRecurringPaymentAgreementInformation(123)).resolves.toEqual(
        expect.objectContaining({ ok: true, status: 200 })
      )
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/agreement/123', { headers: recurringHeaders, method: 'get', timeout: 10000 })
    })

    it('logs and throws errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      fetch.mockImplementation(() => {
        throw new Error('test event error')
      })
      await expect(govUkPayApi.getRecurringPaymentAgreementInformation(123)).rejects.toEqual(Error('test event error'))
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
