import { initialize, injectWithCookies, start, stop } from '../../__mocks__/test-utils'
import { ADULT_FULL_1_DAY_LICENCE, MOCK_CONCESSIONS } from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, TEST_TRANSACTION, TEST_STATUS, ORDER_COMPLETE } from '../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The agreed handler', () => {
  it('throw a status 500 (server) exception and the posted status is not set if there is an error fetching reference data', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            json: () => ({}),
            ok: false
          })
        )
    )
    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('throws a status 500 (server) exception and the posted status is not set if the post data does not return OK', async () => {
    fetch.mockReset()
    await ADULT_FULL_1_DAY_LICENCE.setup()
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => MOCK_CONCESSIONS,
              ok: true
            })
          )
      )
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ({}),
              ok: false
            })
          )
      )
    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('throws a status 500 (server) exception and the posted status is not set if there is an error thrown posing data', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => MOCK_CONCESSIONS,
              ok: true
            })
          )
      )
      .mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error())))
    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('throws a status 500 (server) exception and if there is an exception thrown patching data', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => MOCK_CONCESSIONS,
              ok: true
            })
          )
      )
      // Mock response from sales API - create transaction
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      // Mock response from GOV.UK pay API set up payment
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ({
                state: { status: 'created', finished: false },
                payment_id: 'qdq15eu98cpk8bc14qs9ht0t3v',
                payment_provider: 'sandbox',
                created_date: '2020-05-05T07:30:56.214Z',
                _links: {
                  next_url: {
                    href: 'https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0',
                    method: 'GET'
                  },
                  self: {
                    href: 'https://publicapi.payments.service.gov.uk/v1/payments/qdq15eu98cpk8bc14qs9ht0t3v',
                    method: 'GET'
                  }
                }
              }),
              ok: true,
              status: 201
            })
          )
      )

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock response from GOV.PAY API
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ({
                amount: ADULT_FULL_1_DAY_LICENCE.cost,
                state: {
                  status: 'success',
                  finished: true
                }
              }),
              ok: true
            })
          )
      )

      // Mock response from SALES API (patch-transaction)
      .mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error('timeout'))))

    const data2 = await injectWithCookies('GET', AGREED.uri)
    expect(data2.statusCode).toBe(500)
  })

  it('resumes correctly if the finalisation is not performed', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => MOCK_CONCESSIONS,
              ok: true
            })
          )
      )
      // Mock response from sales API - create transaction
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      // Mock response from GOV.UK pay API set up payment
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ({
                state: { status: 'created', finished: false },
                payment_id: 'qdq15eu98cpk8bc14qs9ht0t3v',
                payment_provider: 'sandbox',
                created_date: '2020-05-05T07:30:56.214Z',
                _links: {
                  next_url: {
                    href: 'https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0',
                    method: 'GET'
                  },
                  self: {
                    href: 'https://publicapi.payments.service.gov.uk/v1/payments/qdq15eu98cpk8bc14qs9ht0t3v',
                    method: 'GET'
                  }
                }
              }),
              ok: true,
              status: 201
            })
          )
      )

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock response from GOV.PAY API
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ({
                amount: ADULT_FULL_1_DAY_LICENCE.cost,
                state: {
                  status: 'success',
                  finished: true
                }
              }),
              ok: true
            })
          )
      )

      // Mock response from SALES API (patch-transaction)
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ ok: false })))

    const data2 = await injectWithCookies('GET', AGREED.uri)
    expect(data2.statusCode).toBe(500)

    // Resume correctly
    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ ok: true })))

    const data3 = await injectWithCookies('GET', AGREED.uri)
    expect(data3.statusCode).toBe(302)

    expect(data3.headers.location).toBe(ORDER_COMPLETE.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).toBeTruthy()

    const data4 = await injectWithCookies('GET', AGREED.uri)
    expect(data4.statusCode).toBe(302)
    expect(data4.headers.location).toBe(ORDER_COMPLETE.uri)
  })
})
