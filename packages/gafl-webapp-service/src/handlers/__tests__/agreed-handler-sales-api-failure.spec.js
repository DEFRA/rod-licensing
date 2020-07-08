import { govUkPayApi, salesApi } from '@defra-fish/connectors-lib'
import { initialize, injectWithCookies, start, stop } from '../../__mocks__/test-utils'
import { ADULT_FULL_1_DAY_LICENCE, MOCK_PAYMENT_RESPONSE } from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, TEST_TRANSACTION, TEST_STATUS, ORDER_COMPLETE } from '../../uri.js'

import mockPermits from '../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../__mocks__/data/permit-concessions.js'
import mockConcessions from '../../__mocks__/data/concessions.js'
import mockDefraCountries from '../../__mocks__/data/defra-country.js'

const OLD_ENV = process.env
beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
})
beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))
afterAll(() => { process.env = OLD_ENV })

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
  it('throw a status 500 (server) exception and the posted status is not set if there is an error fetching reference data', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.permits.getAll = jest.fn(async () => new Promise((resolve, reject) => reject(new Error())))
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

  it('throws a status 500 (server) exception and the posted status is not set if the create transaction fails', async () => {
    salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
    salesApi.createTransaction = jest.fn(async () => new Promise((resolve, reject) => reject(new Error())))
    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()

    salesApi.getPaymentJournal = jest.fn()
    expect(salesApi.getPaymentJournal).not.toHaveBeenCalled()
  })

  it('throws a status 500 (server) exception and if there is an exception thrown finalizing the transaction', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    jest.setTimeout(30000)

    salesApi.createTransaction = jest.fn(async () => new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transActionResponse)))

    salesApi.finaliseTransaction = jest.fn(async () => new Promise((resolve, reject) => reject(new Error())))

    govUkPayApi.createPayment = jest.fn(
      async () => new Promise(resolve => resolve({ json: () => MOCK_PAYMENT_RESPONSE, ok: true, status: 201 }))
    )

    govUkPayApi.fetchPaymentStatus = jest.fn(
      async () =>
        new Promise(resolve => resolve({ json: () => paymentStatusSuccess(ADULT_FULL_1_DAY_LICENCE.cost), ok: true, status: 201 }))
    )

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)

    salesApi.updatePaymentJournal = jest.fn()
    const data2 = await injectWithCookies('GET', AGREED.uri)
    expect(data2.statusCode).toBe(500)

    // Due to the error in finalization the payment journal will not be updated -
    // This needs to be cleared by the mop up
    expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()

    // Resume correctly
    salesApi.finaliseTransaction = jest.fn(async () => new Promise(resolve => resolve({ ok: true })))

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
