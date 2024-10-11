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
import agreedHandler from '../agreed-handler.js'
import { v4 as uuidv4 } from 'uuid'

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'GJDJKDKFJ'
  process.env.ANALYTICS_PROPERTY_API = 'XHHDjknw-sadcC'
  process.env.CHANNEL = ''
})
beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => {
  stop(d)
})
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_PROPERTY_API
  delete process.env.CHANNEL
})

jest.mock('@defra-fish/connectors-lib')
jest.mock('uuid', () => ({
  v4: jest.fn()
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

  it('throws a status 403 (forbidden) exception is the agreed flag is not set', async () => {
    const response = await injectWithCookies('GET', AGREED.uri)
    expect(response.statusCode).toBe(403)
  })

  describe.each([
    ['adult full 1 day licence', ADULT_FULL_1_DAY_LICENCE],
    ['adult disabled 12 month licence', ADULT_DISABLED_12_MONTH_LICENCE],
    ['senior 12 month licence', SENIOR_12_MONTH_LICENCE]
  ])('payment journey %s', (desc, journey) => {
    beforeEach(async () => {
      await journey.setup()

      uuidv4.mockResolvedValue(journey.transactionResponse.id)
      salesApi.createTransaction.mockResolvedValue(journey.transactionResponse)
      salesApi.finaliseTransaction.mockResolvedValue(journey.transactionResponse)
      govUkPayApi.createPayment.mockResolvedValue({ json: () => MOCK_PAYMENT_RESPONSE, ok: true, status: 201 })
      govUkPayApi.fetchPaymentStatus.mockResolvedValue({ json: () => paymentStatusSuccess(journey.cost), ok: true, status: 201 })
      salesApi.getPaymentJournal.mockResolvedValue(false)
      salesApi.updatePaymentJournal.mockImplementation(jest.fn())
      salesApi.createPaymentJournal.mockImplementation(jest.fn())
    })

    it('gives a 302 response', async () => {
      const response = await injectWithCookies('GET', AGREED.uri)
      expect(response.statusCode).toBe(302)
    })

    it('redirects to the correct location', async () => {
      const response = await injectWithCookies('GET', AGREED.uri)
      expect(response.headers.location).toBe(MOCK_PAYMENT_RESPONSE._links.next_url.href)
    })

    it('does not call updatePaymentJournal during journal creation', async () => {
      await injectWithCookies('GET', AGREED.uri)
      expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
    })

    it('calls getPaymentJournal with the correct arguments during journal creation', async () => {
      await injectWithCookies('GET', AGREED.uri)
      expect(salesApi.getPaymentJournal).toHaveBeenCalledWith(journey.transactionResponse.id)
    })

    it('calls createPaymentJournal with the correct arguments during journal creation', async () => {
      await injectWithCookies('GET', AGREED.uri)
      expect(salesApi.createPaymentJournal).toHaveBeenCalledWith(journey.transactionResponse.id, {
        paymentReference: MOCK_PAYMENT_RESPONSE.payment_id,
        paymentTimestamp: MOCK_PAYMENT_RESPONSE.created_date,
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      })
    })

    it('gives a 302 response on return from the GOV.UK Payment pages', async () => {
      await injectWithCookies('GET', AGREED.uri)
      const response = await injectWithCookies('GET', AGREED.uri)
      expect(response.statusCode).toBe(302)
    })

    it('loads the order complete page on return from the GOV.UK Payment pages', async () => {
      await injectWithCookies('GET', AGREED.uri)
      const response = await injectWithCookies('GET', AGREED.uri)
      expect(response.headers.location).toHaveValidPathFor(ORDER_COMPLETE.uri)
    })

    it('updates the journal entry with the complete status', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', AGREED.uri)
      expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith(journey.transactionResponse.id, {
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed
      })
    })

    it('updates the cache', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', AGREED.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).id).toBe(journey.transactionResponse.id)
    })

    it('sets the completion status to agreed', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    })

    it('sets the completion status to posted', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    })

    it('sets the completion status to payment created', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).toBeTruthy()
    })

    it('sets the completion status to payment completed', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.paymentCompleted]).toBeTruthy()
    })

    it('sets the completion status to finalised', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
    })

    it('returns a 200 status code when getting the order complete page', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      await injectWithCookies('GET', TEST_STATUS.uri)
      const response = await injectWithCookies('GET', ORDER_COMPLETE.uri)
      expect(response.statusCode).toBe(200)
    })
  })

  describe.each([
    ['junior', JUNIOR_LICENCE],
    ['junior, disabled', JUNIOR_DISABLED_LICENCE]
  ])('no-payment journey %s', (desc, journey) => {
    beforeEach(async () => {
      await journey.setup()

      uuidv4.mockResolvedValue(journey.transactionResponse.id)
      salesApi.createTransaction.mockResolvedValue(journey.transactionResponse)
      salesApi.finaliseTransaction.mockResolvedValue(journey.transactionResponse)
    })

    it('returns a 302 status code', async () => {
      const response = await injectWithCookies('GET', AGREED.uri)
      expect(response.statusCode).toBe(302)
    })

    it('redirects to the order complete page', async () => {
      const response = await injectWithCookies('GET', AGREED.uri)
      expect(response.headers.location).toHaveValidPathFor(ORDER_COMPLETE.uri)
    })

    it('updates the cache', async () => {
      await injectWithCookies('GET', AGREED.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).id).toBe(JUNIOR_LICENCE.transactionResponse.id)
    })

    it('sets the completion status to agreed', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
    })

    it('sets the completion status to posted', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
    })

    it('does not set the completion status to payment created', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    })

    it('does not set the completion status to payment completed', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    })

    it('sets the completion status to finalised', async () => {
      await injectWithCookies('GET', AGREED.uri)
      await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
    })

    it('returns a 200 status code when getting the order complete page', async () => {
      await injectWithCookies('GET', AGREED.uri)
      const response = await injectWithCookies('GET', ORDER_COMPLETE.uri)
      expect(response.statusCode).toBe(200)
    })
  })

  describe('finalised transactions', () => {
    beforeEach(async () => {
      await JUNIOR_LICENCE.setup()
      uuidv4.mockResolvedValue(JUNIOR_LICENCE.transactionResponse.id)
      salesApi.createTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
      salesApi.finaliseTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
      await injectWithCookies('GET', AGREED.uri)
    })

    it('sets the completion status to finalised', async () => {
      const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
      expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).toBeTruthy()
    })

    it('returns a 302 status code', async () => {
      await injectWithCookies('GET', TEST_STATUS.uri)
      const response = await injectWithCookies('GET', AGREED.uri)
      expect(response.statusCode).toBe(302)
    })

    it('loads the order complete page', async () => {
      await injectWithCookies('GET', TEST_STATUS.uri)
      const response = await injectWithCookies('GET', AGREED.uri)
      expect(response.headers.location).toHaveValidPathFor(ORDER_COMPLETE.uri)
    })

    const getMockRequest = (overrides = {}) => ({
      cache: () => ({
        helpers: {
          transaction: {
            get: async () => ({ cost: 0 })
          },
          status: {
            get: async () => ({
              [COMPLETION_STATUS.agreed]: true,
              [COMPLETION_STATUS.posted]: true,
              [COMPLETION_STATUS.finalised]: true
            })
          },
          ...overrides
        }
      })
    })

    const getRequestToolkit = () => ({
      redirectWithLanguageCode: jest.fn()
    })

    it('calls redirect correctly', async () => {
      const requestToolkit = getRequestToolkit()
      const mockRequest = getMockRequest()

      await agreedHandler(mockRequest, requestToolkit)

      expect(requestToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(ORDER_COMPLETE.uri)
    })
  })
})
