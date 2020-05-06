import each from 'jest-each'
import { initialize, injectWithCookie, start, stop } from '../../__mocks__/test-utils'
import {
  ADULT_FULL_1_DAY_LICENCE,
  ADULT_DISABLED_12_MONTH_LICENCE,
  SENIOR_12_MONTH_LICENCE,
  MOCK_CONCESSIONS,
  JUNIOR_12_MONTH_LICENCE
} from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, FINALISED, TEST_TRANSACTION, TEST_STATUS } from '../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The agreed handler', () => {
  it('throws a status 403 (forbidden) exception is the agreed flag is not set', async () => {
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(403)
  })

  each([
    ['adult full 1 day licence', ADULT_FULL_1_DAY_LICENCE],
    ['adult disabled 12 month licence', ADULT_DISABLED_12_MONTH_LICENCE],
    ['senior 12 month licence', SENIOR_12_MONTH_LICENCE]
  ]).it("sets the 'posted' flag and redirects to the finalised or payment handler for a %s", async (desc, journey) => {
    await journey.setup()
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
              json: () => journey.transActionResponse,
              ok: true
            })
          )
      )
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
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(
      journey.transActionResponse.cost ? 'https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0' : FINALISED.uri
    )
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(journey.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    if (journey.transActionResponse.cost) {
      expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
      expect(JSON.parse(status)[COMPLETION_STATUS.payed]).not.toBeTruthy()
    }
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it("sets the 'posted' flag and redirects to the finalised handler for a junior 12 month licence ", async () => {
    await JUNIOR_12_MONTH_LICENCE.setup()
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
              json: () => JUNIOR_12_MONTH_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(FINALISED.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(JUNIOR_12_MONTH_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('ensures if a transaction has already been posted it is not posted again', async () => {
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.headers.location).toBe(FINALISED.uri)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 error with the retry flag set if the GOV.UK Pay API throws a recoverable exception ', async () => {
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
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 error with the retry flag set if the GOV.UK Pay API rate limit is exceeded', async () => {
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
                code: 'P0900',
                description: 'Too many requests'
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
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
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
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
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
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

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
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
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
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
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
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })
})
