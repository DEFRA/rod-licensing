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
import { AGREED, TEST_TRANSACTION, TEST_STATUS, ORDER_COMPLETE } from '../../uri.js'

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
  ]).it('processes the series of steps necessary to complete a successful payment journey - %s', async (desc, journey) => {
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
      // Mock response from sales API - create transaction
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => journey.transActionResponse,
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

    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0')

    // Mock response from GOV.PAY API
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ({
                amount: journey.cost,
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
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ ok: true })))

    const data2 = await injectWithCookie('GET', AGREED.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(ORDER_COMPLETE.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(journey.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCompleted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
  })

  it('processes the series of steps necessary to complete a successful no-payment journey', async () => {
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
      // Mock response from sales API - create transaction
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => JUNIOR_12_MONTH_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      // Mock response from SALES API (patch-transaction)
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ ok: true })))

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(ORDER_COMPLETE.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(JUNIOR_12_MONTH_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
  })

  it('processes the series of steps necessary to complete a successful no-payment journey', async () => {
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
      // Mock response from sales API - create transaction
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => JUNIOR_12_MONTH_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      // Mock response from SALES API (patch-transaction)
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ ok: true })))

    const data1 = await injectWithCookie('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(ORDER_COMPLETE.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(JUNIOR_12_MONTH_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
  })

  it('redirects to order-completed for finalized transactions', async () => {
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
      // Mock response from sales API - create transaction
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => JUNIOR_12_MONTH_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      // Mock response from SALES API (patch-transaction)
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ ok: true })))

    await injectWithCookie('GET', AGREED.uri)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ORDER_COMPLETE.uri)
  })
})
