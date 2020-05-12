import { initialize, injectWithCookie, postRedirectGet, start, stop } from '../../__mocks__/test-utils'
import { ADULT_FULL_1_DAY_LICENCE, MOCK_CONCESSIONS } from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, TEST_TRANSACTION, TEST_STATUS, PAYMENT_FAILED, PAYMENT_CANCELLED } from '../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The agreed handler', () => {
  it('redirects to the payment-failed page if the GOV.UK Pay returns payment-rejected', async () => {
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

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock API payment query response
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            json: () => ({
              state: {
                status: 'failed',
                finished: true,
                message: 'Payment method rejected',
                code: 'P0010'
              }
            }),
            ok: true,
            status: 200
          })
        )
    )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(PAYMENT_FAILED.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()

    await injectWithCookie('GET', PAYMENT_FAILED.uri)
    const data2 = await postRedirectGet(PAYMENT_FAILED.uri, {})
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(AGREED.uri)

    const { payload: status2 } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus2 = JSON.parse(status2)
    expect(parsedStatus2[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('redirects to the payment-failed page if the GOV.UK Pay returns payment-expired', async () => {
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

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock API payment query response
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            json: () => ({
              state: {
                status: 'failed',
                finished: true,
                message: 'Payment expired',
                code: 'P0020'
              }
            }),
            ok: true,
            status: 200
          })
        )
    )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(PAYMENT_FAILED.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('redirects to the payment-cancelled page if the GOV.UK Pay returns payment-cancelled-by-user', async () => {
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

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock API payment query response
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            json: () => ({
              state: {
                status: 'cancelled',
                finished: true,
                message: 'Payment cancelled by your user',
                code: 'P0030'
              }
            }),
            ok: true,
            status: 200
          })
        )
    )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(PAYMENT_CANCELLED.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()

    await injectWithCookie('GET', PAYMENT_CANCELLED.uri)
    const data2 = await postRedirectGet(PAYMENT_CANCELLED.uri, {})
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(AGREED.uri)

    const { payload: status2 } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus2 = JSON.parse(status2)
    expect(parsedStatus2[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus2[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('redirects to the payment-failed page if the GOV.UK Pay returns payment provider error', async () => {
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

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock API payment query response
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            json: () => ({
              state: {
                status: 'error',
                finished: true,
                message: 'Payment provider returned an error',
                code: 'P0050'
              }
            }),
            ok: true,
            status: 200
          })
        )
    )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(PAYMENT_FAILED.uri)
    const paymentFailed = await injectWithCookie('GET', PAYMENT_FAILED.uri)
    expect(paymentFailed.payload.includes('Try payment again')).toBeTruthy()
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 (server) error with the retry flag set if the GOV.UK Pay API throws a recoverable exception ', async () => {
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
              json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      .mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error('Timed Out'))))
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes('Try again')).toBeTruthy()
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 (server) error with the retry flag set if the GOV.UK Pay API rate limit is exceeded', async () => {
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
                state: {
                  status: 'failed',
                  finished: true,
                  message: 'Too many requests',
                  code: 'P0900'
                }
              }),
              ok: false,
              status: 429
            })
          )
      )

    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes('Try again')).toBeTruthy()
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 error without the retry flag set if the GOV.UK Pay API returns any arbitrary 400 error', async () => {
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
              json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ({
                code: 'P0200',
                description: 'paymentId not found'
              }),
              ok: false,
              status: 404
            })
          )
      )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes('Try again')).not.toBeTruthy()
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 error without the retry flag set if the GOV.UK Pay API returns any arbitrary 500 error', async () => {
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
              json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ({
                code: 'P0999',
                description: 'GOV.UK Pay is unavailable'
              }),
              ok: false,
              status: 500
            })
          )
      )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes('Try again')).not.toBeTruthy()
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 400 (forbidden) error if requested where if the GOV.UK Pay API returns an incomplete payment status', async () => {
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

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock API payment query response
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            json: () => ({
              state: {
                status: 'started',
                finished: false
              }
            }),
            ok: true,
            status: 200
          })
        )
    )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(403)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 (server) error if requested where if the GOV.UK Pay API throws an exception', async () => {
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

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock API payment query response
    fetch.mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error('Timed Out'))))
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 (server) error if the GOV.UK Pay API returns an arbitrary 400/500 error', async () => {
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

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock API payment query response
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            json: () => ({
              state: {
                status: 'error',
                finished: false
              }
            }),
            ok: false,
            status: 404
          })
        )
    )

    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 (server) error if the GOV.UK Pay API returns an the rate limit response', async () => {
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

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock API payment query response
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            json: () => ({
              state: {
                status: 'failed',
                finished: false,
                message: 'Too many requests',
                code: 'P0900'
              }
            }),
            ok: false,
            status: 429
          })
        )
    )

    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })
})
