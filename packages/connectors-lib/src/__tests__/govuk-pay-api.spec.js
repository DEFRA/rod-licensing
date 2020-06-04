import * as govUkPayApi from '../govuk-pay-api.js'
jest.mock('node-fetch')
const fetch = require('node-fetch')

process.env.GOV_PAY_API_URL = 'http://0.0.0.0/payment'
process.env.GOV_PAY_APIKEY = 'key'

const headers = {
  accept: 'application/json',
  authorization: `Bearer ${process.env.GOV_PAY_APIKEY}`,
  'content-type': 'application/json'
}

describe('govuk-pay--api-connector', () => {
  beforeEach(jest.clearAllMocks)

  it('create payment', async () => {
    fetch.mockReturnValue({ ok: true, status: 200 })
    await expect(govUkPayApi.createPayment({ cost: 0 })).resolves.toEqual({ ok: true, status: 200 })
    expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment', {
      body: JSON.stringify({ cost: 0 }),
      headers,
      method: 'post',
      timeout: 10000
    })
  })

  it('create payment re-throws fetch error', async () => {
    fetch.mockImplementation(() => {
      throw new Error('')
    })
    expect(govUkPayApi.createPayment({ cost: 0 })).rejects.toEqual(Error(''))
    expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment', {
      body: JSON.stringify({ cost: 0 }),
      headers,
      method: 'post',
      timeout: 10000
    })
  })

  it('query payment status', async () => {
    fetch.mockReturnValue({ ok: true, status: 200, json: () => {} })
    await expect(govUkPayApi.fetchPaymentStatus(123)).resolves.toEqual(expect.objectContaining({ ok: true, status: 200 }))
    expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment/123', { headers, method: 'get', timeout: 10000 })
  })

  it('query payment status re-throws fetch error', async () => {
    fetch.mockImplementation(() => {
      throw new Error('')
    })
    await expect(govUkPayApi.fetchPaymentStatus(123)).rejects.toEqual(Error(''))
    expect(fetch).toHaveBeenCalledWith('http://0.0.0.0/payment/123', { headers, method: 'get', timeout: 10000 })
  })
})
