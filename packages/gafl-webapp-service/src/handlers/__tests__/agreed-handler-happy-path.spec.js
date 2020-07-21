import { govUkPayApi, salesApi } from '@defra-fish/connectors-lib'
import { initialize, injectWithCookies, start, stop } from '../../__mocks__/test-utils'

import {
  ADULT_FULL_1_DAY_LICENCE,
  ADULT_DISABLED_12_MONTH_LICENCE,
  SENIOR_12_MONTH_LICENCE,
  MOCK_PAYMENT_RESPONSE,
  JUNIOR_12_MONTH_LICENCE
} from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, TEST_TRANSACTION, TEST_STATUS, ORDER_COMPLETE } from '../../uri.js'

import mockPermits from '../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../__mocks__/data/permit-concessions.js'
import mockConcessions from '../../__mocks__/data/concessions.js'
import mockDefraCountries from '../../__mocks__/data/defra-country.js'
import { PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
  process.env.CHANNEL = ''
})
beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_XGOV_PROPERTY
  delete process.env.CHANNEL
})

jest.mock('@defra-fish/connectors-lib')
salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
salesApi.permitConcessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermitsConcessions)))
salesApi.concessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockConcessions)))
salesApi.countries.getAll = jest.fn(async () => new Promise(resolve => resolve(mockDefraCountries)))

const paymentStatusSuccess = cost => ({
  amount: cost,
  state: {
    status: 'success',
    finished: true
  }
})

describe('The agreed handler', () => {
  it('throws a status 403 (forbidden) exception is the agreed flag is not set', async () => {
    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(403)
  })

  it.each([
    ['adult full 1 day licence', ADULT_FULL_1_DAY_LICENCE],
    ['adult disabled 12 month licence', ADULT_DISABLED_12_MONTH_LICENCE],
    ['senior 12 month licence', SENIOR_12_MONTH_LICENCE]
  ])('processes the series of steps necessary to complete a successful payment journey - %s', async (desc, journey) => {
    await journey.setup()

    salesApi.createTransaction = jest.fn(async () => new Promise(resolve => resolve(journey.transActionResponse)))

    salesApi.finaliseTransaction = jest.fn(async () => new Promise(resolve => resolve({ ok: true })))

    govUkPayApi.createPayment = jest.fn(
      async () => new Promise(resolve => resolve({ json: () => MOCK_PAYMENT_RESPONSE, ok: true, status: 201 }))
    )

    govUkPayApi.fetchPaymentStatus = jest.fn(
      async () => new Promise(resolve => resolve({ json: () => paymentStatusSuccess(journey.cost), ok: true, status: 201 }))
    )

    salesApi.getPaymentJournal = jest.fn(async () => false)
    salesApi.updatePaymentJournal = jest.fn()
    salesApi.createPaymentJournal = jest.fn()

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)

    // Check the journal creation
    expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
    expect(salesApi.getPaymentJournal).toHaveBeenCalledWith(journey.transActionResponse.id)
    expect(salesApi.createPaymentJournal).toHaveBeenCalledWith(journey.transActionResponse.id, {
      paymentReference: MOCK_PAYMENT_RESPONSE.payment_id,
      paymentTimestamp: MOCK_PAYMENT_RESPONSE.created_date,
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
    })

    // On return from the GOV.UK Payment pages
    const data2 = await injectWithCookies('GET', AGREED.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(ORDER_COMPLETE.uri)

    // Check that the journal entry is updated with the complete status
    // salesApi.updatePaymentJournal = jest.fn()
    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith(journey.transActionResponse.id, {
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed
    })

    // Check the cache status
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(journey.transActionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCompleted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()

    const data3 = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data3.statusCode).toBe(200)
  })

  it('processes the series of steps necessary to complete a successful no-payment journey', async () => {
    await JUNIOR_12_MONTH_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () => new Promise(resolve => resolve(JUNIOR_12_MONTH_LICENCE.transActionResponse)))

    salesApi.finaliseTransaction = jest.fn(async () => new Promise(resolve => resolve({ ok: true })))

    const data1 = await injectWithCookies('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(ORDER_COMPLETE.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(JUNIOR_12_MONTH_LICENCE.transActionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
    const data3 = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data3.statusCode).toBe(200)
  })

  it('redirects to order-completed for finalized transactions', async () => {
    await JUNIOR_12_MONTH_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () => new Promise(resolve => resolve(JUNIOR_12_MONTH_LICENCE.transActionResponse)))
    salesApi.finaliseTransaction = jest.fn(async () => new Promise(resolve => resolve({ ok: true })))
    await injectWithCookies('GET', AGREED.uri)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ORDER_COMPLETE.uri)
    await injectWithCookies('GET', ORDER_COMPLETE.uri)
  })
})
