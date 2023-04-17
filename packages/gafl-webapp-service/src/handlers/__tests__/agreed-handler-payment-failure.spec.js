import { govUkPayApi, salesApi } from '@defra-fish/connectors-lib'
import { GOVUK_PAY_ERROR_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { initialize, injectWithCookies, start, stop, mockSalesApi } from '../../__mocks__/test-utils-system'
import { ADULT_FULL_1_DAY_LICENCE } from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, TEST_TRANSACTION, TEST_STATUS, PAYMENT_FAILED, PAYMENT_CANCELLED } from '../../uri.js'

import agreedHandler from '../agreed-handler.js'
import { getPaymentStatus, sendPayment } from '../../services/payment/govuk-pay-service.js'
import { preparePayment } from '../../processors/payment.js'
jest.mock('../../services/payment/govuk-pay-service.js')
jest.mock('../../processors/payment.js')

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
})
beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_XGOV_PROPERTY
})

jest.mock('@defra-fish/connectors-lib')
mockSalesApi()

const TRY_AGAIN_STR = 'Try again'

const paymentTooManyRequests = {
  state: {
    finished: true,
    status: 'failed',
    message: 'Too many requests',
    code: 'P0900'
  }
}

const paymentIdNotFound = {
  state: {
    finished: true,
    code: 'P0200',
    description: 'paymentId not found'
  }
}

const paymentGovUkPayUnavailable = {
  code: 'P0999',
  description: 'GOV.UK Pay is unavailable'
}

const getMockRequest = () => ({
  cache: () => ({
    helpers: {
      transaction: {
        get: async () => ({
          cost: 100,
          payment: {
            payment_id: 'abc-123'
          }
        })
      },
      status: {
        get: async () => ({
          [COMPLETION_STATUS.agreed]: true,
          [COMPLETION_STATUS.posted]: true,
          [COMPLETION_STATUS.paymentCreated]: true
        }),
        set: async () => ({})
      }
    }
  }),
  headers: { 'x-forwarded-proto': 'https' },
  info: { host: 'localhost:1234' },
  server: { info: { protocol: '' } }
})

const getRequestToolkit = () => ({
  redirectWithLanguageCode: jest.fn()
})

const getSendPaymentMockImplementation = () => ({
  payment_id: '',
  created_date: '',
  state: '',
  payment_provider: '',
  _links: {
    next_url: {
      href: ''
    },
    self: {
      href: ''
    }
  }
})

describe('The agreed handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { sendPayment: realSendPayment, getPaymentStatus: realGetPaymentStatus } = jest.requireActual(
      '../../services/payment/govuk-pay-service.js'
    )
    const { preparePayment: realPreparePayment } = jest.requireActual('../../processors/payment.js')
    getPaymentStatus.mockImplementation(paymentId => realGetPaymentStatus(paymentId))
    preparePayment.mockImplementation((request, transaction) => realPreparePayment(request, transaction))
    sendPayment.mockImplementation(preparedPayment => realSendPayment(preparedPayment))
  })

  describe('GOV.UK returns an expired response', () => {
    beforeEach(() => {
      getPaymentStatus.mockReturnValueOnce({
        state: {
          finished: true,
          status: 'failed',
          code: GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED
        }
      })
    })

    it('calls redirect correctly', async () => {
      preparePayment.mockImplementation(() => {})
      sendPayment.mockImplementation(() => getSendPaymentMockImplementation())
      const requestToolkit = getRequestToolkit()
      const mockRequest = getMockRequest()

      await agreedHandler(mockRequest, requestToolkit)

      expect(requestToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(PAYMENT_FAILED.uri)
    })
  })

  describe('GOV.UK returns a rejected response', () => {
    beforeEach(() => {
      getPaymentStatus.mockReturnValueOnce({
        state: {
          finished: true,
          status: 'failed',
          code: GOVUK_PAY_ERROR_STATUS_CODES.REJECTED
        }
      })
    })

    it('calls redirect correctly', async () => {
      preparePayment.mockImplementation(() => {})
      sendPayment.mockImplementation(() => getSendPaymentMockImplementation())
      const requestToolkit = getRequestToolkit()
      const mockRequest = getMockRequest()

      await agreedHandler(mockRequest, requestToolkit)

      expect(requestToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(PAYMENT_FAILED.uri)
    })
  })

  describe('GOV.UK returns a cancelled response', () => {
    beforeEach(() => {
      getPaymentStatus.mockReturnValueOnce({
        state: {
          finished: true,
          status: 'failed',
          code: GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED
        }
      })
    })

    it('calls redirect correctly', async () => {
      preparePayment.mockImplementation(() => {})
      sendPayment.mockImplementation(() => getSendPaymentMockImplementation())
      const requestToolkit = getRequestToolkit()
      const mockRequest = getMockRequest()

      await agreedHandler(mockRequest, requestToolkit)

      expect(requestToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(PAYMENT_CANCELLED.uri)
    })
  })

  it('posts a 500 (server) error with the retry flag set if the GOV.UK Pay API throws a (recoverable) exception on payment creation', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () => new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transactionResponse)))

    govUkPayApi.createPayment = jest.fn(async () => new Promise((resolve, reject) => reject(new Error('Time out'))))

    salesApi.getPaymentJournal = jest.fn()
    salesApi.updatePaymentJournal = jest.fn()
    salesApi.createPaymentJournal = jest.fn()

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transactionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()

    // The journal is entry is not created where the API throws an exception
    expect(salesApi.getPaymentJournal).not.toHaveBeenCalled()
    expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
    expect(salesApi.createPaymentJournal).not.toHaveBeenCalled()
  })

  it('posts a 500 (server) error with the retry flag set if the GOV.UK Pay API rate limit is exceeded on create payment', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () => new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transactionResponse)))

    govUkPayApi.createPayment = jest.fn(
      async () => new Promise(resolve => resolve({ json: () => paymentTooManyRequests, ok: false, status: 429 }))
    )

    salesApi.createPaymentJournal = jest.fn()

    const data = await injectWithCookies('GET', AGREED.uri)

    // No journal entry is created
    expect(salesApi.createPaymentJournal).not.toHaveBeenCalled()

    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transactionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCompleted]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 error without the retry flag set if the GOV.UK Pay API returns any arbitrary 400 error on payment creation', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()

    salesApi.createTransaction = jest.fn(async () => new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transactionResponse)))

    govUkPayApi.createPayment = jest.fn(
      async () => new Promise(resolve => resolve({ json: () => paymentIdNotFound, ok: false, status: 404 }))
    )

    salesApi.createPaymentJournal = jest.fn()

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(salesApi.createPaymentJournal).not.toHaveBeenCalled()
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes(TRY_AGAIN_STR)).not.toBeTruthy()
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transactionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })

  it('posts a 500 error without the retry flag set if the GOV.UK Pay API returns any arbitrary 500 error on payment creation', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () => new Promise(resolve => resolve(ADULT_FULL_1_DAY_LICENCE.transactionResponse)))

    govUkPayApi.createPayment = jest.fn(
      async () => new Promise(resolve => resolve({ json: () => paymentGovUkPayUnavailable, ok: false, status: 500 }))
    )

    salesApi.createPaymentJournal = jest.fn()

    const data = await injectWithCookies('GET', AGREED.uri)
    expect(salesApi.createPaymentJournal).not.toHaveBeenCalled()
    expect(data.statusCode).toBe(500)
    expect(data.payload.includes(TRY_AGAIN_STR)).not.toBeTruthy()
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transactionResponse.id)
    const { payload: status } = await injectWithCookies('GET', TEST_STATUS.uri)
    const parsedStatus = JSON.parse(status)
    expect(parsedStatus[COMPLETION_STATUS.agreed]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.posted]).toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.payed]).not.toBeTruthy()
    expect(parsedStatus[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  })
})
