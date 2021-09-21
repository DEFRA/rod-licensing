import { govUkPayApi, salesApi } from '@defra-fish/connectors-lib'
import { initialize, injectWithCookies, start, stop, mockSalesApi } from '../../__mocks__/test-utils-system'

import {
  ADULT_FULL_1_DAY_LICENCE,
  ADULT_DISABLED_12_MONTH_LICENCE,
  SENIOR_12_MONTH_LICENCE,
  MOCK_PAYMENT_RESPONSE,
  JUNIOR_LICENCE,
  JUNIOR_DISABLED_LICENCE
} from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, TEST_TRANSACTION, TEST_STATUS, ORDER_COMPLETE } from '../../uri.js'
import { PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
  process.env.CHANNEL = ''
})
beforeAll(() => start(() => {}))
beforeAll(() => initialize(() => {}))
afterAll(() => stop(() => {}))
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_XGOV_PROPERTY
  delete process.env.CHANNEL
})

jest.mock('@defra-fish/connectors-lib')
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

  it('throws a status 403 (forbidden) exception is the agreed flag is not set', async () => {
    const response = await injectWithCookies('GET', AGREED.uri)
    expect(response.statusCode).toBe(403)
  })

  it.each([
    ['adult full 1 day licence', ADULT_FULL_1_DAY_LICENCE],
    ['adult disabled 12 month licence', ADULT_DISABLED_12_MONTH_LICENCE],
    ['senior 12 month licence', SENIOR_12_MONTH_LICENCE]
  ])('processes the series of steps necessary to complete a successful payment journey - %s', async (desc, journey) => {
    await journey.setup()

    salesApi.createTransaction.mockResolvedValue(journey.transactionResponse)
    salesApi.finaliseTransaction.mockResolvedValue(journey.transactionResponse)
    govUkPayApi.createPayment.mockResolvedValue({ json: () => MOCK_PAYMENT_RESPONSE, ok: true, status: 201 })
    govUkPayApi.fetchPaymentStatus.mockResolvedValue({ json: () => paymentStatusSuccess(journey.cost), ok: true, status: 201 })
    salesApi.getPaymentJournal.mockResolvedValue(false)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.createPaymentJournal.mockImplementation(jest.fn())

    const response = await injectWithCookies('GET', AGREED.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)

    // Check the journal creation
    expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
    expect(salesApi.getPaymentJournal).toHaveBeenCalledWith(journey.transactionResponse.id)
    expect(salesApi.createPaymentJournal).toHaveBeenCalledWith(journey.transactionResponse.id, {
      paymentReference: MOCK_PAYMENT_RESPONSE.payment_id,
      paymentTimestamp: MOCK_PAYMENT_RESPONSE.created_date,
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
    })

    // On return from the GOV.UK Payment pages
    const response2 = await injectWithCookies('GET', AGREED.uri)
    expect(response2.statusCode).toBe(302)
    expect(response2.headers.location).toBe(ORDER_COMPLETE.uri)

    // Check that the journal entry is updated with the complete status
    // salesApi.updatePaymentJournal = jest.fn()
    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith(journey.transactionResponse.id, {
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed
    })

    // Check the cache status
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(journey.transactionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCompleted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()

    const response3 = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(response3.statusCode).toBe(200)
  })

  it.each([
    ['junior', JUNIOR_LICENCE],
    ['junior, disabled', JUNIOR_DISABLED_LICENCE]
  ])('processes the series of steps necessary to complete a successful no-payment journey: %s', async (desc, journey) => {
    await journey.setup()
    salesApi.createTransaction.mockResolvedValue(journey.transactionResponse)
    salesApi.finaliseTransaction.mockResolvedValue(journey.transactionResponse)
    const response1 = await injectWithCookies('GET', AGREED.uri)
    expect(response1.statusCode).toBe(302)
    expect(response1.headers.location).toBe(ORDER_COMPLETE.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(JUNIOR_LICENCE.transactionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
    const response3 = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(response3.statusCode).toBe(200)
  })

  it('redirects to order-completed for finalized transactions', async () => {
    await JUNIOR_LICENCE.setup()
    salesApi.createTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
    await injectWithCookies('GET', AGREED.uri)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
    const response = await injectWithCookies('GET', AGREED.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ORDER_COMPLETE.uri)
    await injectWithCookies('GET', ORDER_COMPLETE.uri)
  })
})
