import { govUkPayApi, salesApi } from '@defra-fish/connectors-lib'
import { initialize, injectWithCookies, start, stop, mockSalesApi } from '../../__mocks__/test-utils-system'
import { ADULT_FULL_1_DAY_LICENCE, MOCK_PAYMENT_RESPONSE } from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, TEST_TRANSACTION, TEST_STATUS, ORDER_COMPLETE } from '../../uri.js'

import mockPermits from '../../__mocks__/data/permits.js'
import { v4 as uuidv4 } from 'uuid'

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'GJDJKDKFJ'
  process.env.ANALYTICS_PROPERTY_API = 'XHHDjknw-sadcC'
})
beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_PROPERTY_API
})

jest.mock('@defra-fish/connectors-lib')
jest.mock('uuid', () => ({
  v4: jest.fn(() => '')
}))
mockSalesApi()

const paymentStatusSuccess = cost => ({
  amount: cost,
  state: {
    status: 'success',
    finished: true
  }
})

describe('The agreed handler', () => {
  beforeEach(jest.clearAllMocks)

  it('throw a status 500 (server) exception and the posted status is not set if there is an error fetching reference data', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.permits.getAll = jest.fn(async () => new Promise((resolve, reject) => reject(new Error())))
    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    console.log('payload', payload)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('throws a status 500 (server) exception and the posted status is not set if the create transaction fails', async () => {
    salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
    salesApi.createTransaction.mockRejectedValue(new Error())
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
    uuidv4.mockReturnValue(ADULT_FULL_1_DAY_LICENCE.transactionResponse.id)
    salesApi.createTransaction.mockResolvedValue(ADULT_FULL_1_DAY_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockRejectedValue(new Error())
    govUkPayApi.createPayment.mockResolvedValue({ json: () => MOCK_PAYMENT_RESPONSE, ok: true, status: 201 })
    govUkPayApi.fetchPaymentStatus.mockResolvedValue({
      json: () => paymentStatusSuccess(ADULT_FULL_1_DAY_LICENCE.cost),
      ok: true,
      status: 201
    })

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)

    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    const data2 = await injectWithCookies('GET', AGREED.uri)
    expect(data2.statusCode).toBe(500)

    // Due to the error in finalization the payment journal will not be updated -
    // This needs to be cleared by the mop up
    expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()

    // Resume correctly
    salesApi.finaliseTransaction.mockResolvedValue(ADULT_FULL_1_DAY_LICENCE.transactionResponse)

    const data3 = await injectWithCookies('GET', AGREED.uri)
    expect(data3.statusCode).toBe(302)

    expect(data3.headers.location).toHaveValidPathFor(ORDER_COMPLETE.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transactionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).toBeTruthy()

    const data4 = await injectWithCookies('GET', AGREED.uri)
    expect(data4.statusCode).toBe(302)
    expect(data4.headers.location).toHaveValidPathFor(ORDER_COMPLETE.uri)
  })
})
