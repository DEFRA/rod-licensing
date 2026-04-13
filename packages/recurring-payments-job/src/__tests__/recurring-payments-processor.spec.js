import { airbrake, salesApi, HTTPRequestBatcher } from '@defra-fish/connectors-lib'
import { PAYMENT_STATUS, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { execute } from '../recurring-payments-processor.js'
import { isGovPayUp } from '../services/govuk-pay-service.js'
import db from 'debug'

jest.mock('@defra-fish/business-rules-lib', () => ({
  PAYMENT_STATUS: {
    Success: 'payment status success',
    Failure: 'payment status failure',
    Error: 'payment status error'
  },
  PAYMENT_JOURNAL_STATUS_CODES: {
    InProgress: 'in progress payment',
    Cancelled: 'cancelled payment',
    Failed: 'failed payment',
    Expired: 'expired payment',
    Completed: 'completed payment'
  }
}))

jest.mock('@defra-fish/connectors-lib', () => ({
  airbrake: {
    initialise: jest.fn(),
    flush: jest.fn()
  },
  salesApi: {
    cancelRecurringPayment: jest.fn(),
    createPaymentJournal: jest.fn(),
    createTransaction: jest.fn(() => ({
      id: 'test-transaction-id',
      cost: 30,
      recurringPayment: { id: 'recurring-payment-1' }
    })),
    getDueRecurringPayments: jest.fn(() => []),
    getPaymentJournal: jest.fn(),
    preparePermissionDataForRenewal: jest.fn(() => ({
      licensee: { countryCode: 'GB-ENG' }
    })),
    processRPResult: jest.fn(),
    updatePaymentJournal: jest.fn()
  },
  HTTPRequestBatcher: jest.fn()
}))

jest.mock('../services/govuk-pay-service.js', () => ({
  isGovPayUp: jest.fn(() => true)
}))

jest.mock('debug', () => jest.fn(() => jest.fn()))

const GOV_PAY_API_URL = 'https://publicapi.payments.service.gov.uk/v1/payments'
const GOV_PAY_RECURRING_APIKEY = 'test-recurring-api-key'
const PAYMENT_STATUS_DELAY = 60000

// ── Response factories ────────────────────────────────────────────────────────

const mockCreationOkResponse = ({
  payment_id = 'pay-1',
  reference = 'test-transaction-id',
  created_date = '2025-01-01T00:00:00.000Z'
} = {}) => ({
  ok: true,
  status: 200,
  url: GOV_PAY_API_URL,
  json: jest.fn().mockResolvedValue({ payment_id, reference, created_date })
})

const mockCreationErrorResponse = ({ status = 422, description = 'An error occurred' } = {}) => ({
  ok: false,
  status,
  url: GOV_PAY_API_URL,
  json: jest.fn().mockResolvedValue({ description })
})

const mock429Response = (url = GOV_PAY_API_URL) => ({
  ok: false,
  status: 429,
  url,
  json: jest.fn()
})

const mockStatusOkResponse = (paymentId, status) => ({
  ok: true,
  status: 200,
  url: `${GOV_PAY_API_URL}/${paymentId}`,
  json: jest.fn().mockResolvedValue({ state: { status } })
})

const mockStatusErrorResponse = (paymentId, httpStatus) => ({
  ok: false,
  status: httpStatus,
  url: `${GOV_PAY_API_URL}/${paymentId}`,
  json: jest.fn().mockResolvedValue({ code: 'ERR', description: 'error' })
})

// ── Batcher mock factory ──────────────────────────────────────────────────────

const makeBatcherMock = (responses = []) => ({
  addRequest: jest.fn(),
  fetch: jest.fn().mockResolvedValue(undefined),
  responses
})

// ── Data factories ────────────────────────────────────────────────────────────

const getMockDueRecurringPayment = ({ agreementId = 'test-agreement-id', id = 'abc-123', referenceNumber = '123' } = {}) => ({
  entity: { id, agreementId },
  expanded: { activePermission: { entity: { referenceNumber } } }
})

const getMockPaymentRequestResponse = () => [
  {
    entity: { agreementId: 'agreement-1' },
    expanded: { activePermission: { entity: { referenceNumber: 'ref-1' } } }
  }
]

const getPaymentStatusSuccess = () => ({ state: { status: 'payment status success' } })
const getPaymentStatusFailure = () => ({ state: { status: 'payment status failure' } })
const getPaymentStatusError = () => ({ state: { status: 'payment status error' } })

// ── Test helpers ──────────────────────────────────────────────────────────────

/**
 * Configures the HTTPRequestBatcher mock and salesApi mocks for a single-payment
 * happy-path scenario, returning the batcher mock instances for assertions.
 */
const setupSinglePayment = ({
  agreementId = 'test-agreement-id',
  id = 'abc-123',
  referenceNumber = '123',
  transactionId = 'test-transaction-id',
  paymentId = 'pay-1',
  created_date = '2025-01-01T00:00:00.000Z',
  paymentStatus = 'payment status success',
  permissionData = { licensee: { countryCode: 'GB-ENG' } }
} = {}) => {
  salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId, id, referenceNumber })])
  salesApi.preparePermissionDataForRenewal.mockReturnValueOnce(permissionData)
  salesApi.createTransaction.mockReturnValueOnce({ id: transactionId, cost: 30, recurringPayment: { id } })

  const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: paymentId, reference: transactionId, created_date })])
  const statusBatcher = makeBatcherMock([mockStatusOkResponse(paymentId, paymentStatus)])

  HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

  return { creationBatcher, statusBatcher, paymentId, transactionId, agreementId, created_date }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('recurring-payments-processor', () => {
  const [{ value: debugLogger }] = db.mock.results

  beforeAll(() => {
    process.env.GOV_PAY_API_URL = GOV_PAY_API_URL
    process.env.GOV_PAY_RECURRING_APIKEY = GOV_PAY_RECURRING_APIKEY
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
    // Restore default implementations that tests depend on
    isGovPayUp.mockReturnValue(true)
    salesApi.getDueRecurringPayments.mockReturnValue([])
    salesApi.createTransaction.mockReturnValue({ id: 'test-transaction-id', cost: 30, recurringPayment: { id: 'recurring-payment-1' } })
    salesApi.preparePermissionDataForRenewal.mockReturnValue({ licensee: { countryCode: 'GB-ENG' } })
    HTTPRequestBatcher.mockImplementation(() => makeBatcherMock())
    process.env.RUN_RECURRING_PAYMENTS = 'true'
    delete process.env.RCP_BATCHER_BATCH_SIZE
    delete process.env.RCP_BATCHER_DELAY_MS
    global.setTimeout = jest.fn((cb, ms) => cb())
  })

  it('initialises airbrake', () => {
    jest.isolateModules(async () => {
      require('../recurring-payments-processor.js')
      await execute()
      expect(airbrake.initialise).toHaveBeenCalled()
    })
  })

  it('flushes airbrake before script ends', () => {
    jest.isolateModules(async () => {
      const { execute } = require('../recurring-payments-processor.js')
      await execute()
      expect(airbrake.flush).toHaveBeenCalled()
    })
  })

  it("doesn't flush airbrake before execute has been called", () => {
    jest.isolateModules(() => {
      require('../recurring-payments-processor.js')
      expect(airbrake.flush).not.toHaveBeenCalled()
    })
  })

  it.each([
    ['SIGINT', 130],
    ['SIGTERM', 137]
  ])('flushes airbrake on %s signal', (signal, code) => {
    jest.isolateModules(() => {
      process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '1'
      const signalCallbacks = {}
      jest.spyOn(process, 'on')
      jest.spyOn(process, 'exit')
      process.on.mockImplementation((signalToken, callback) => {
        signalCallbacks[signalToken] = callback
      })
      process.exit.mockImplementation(() => {})

      require('../recurring-payments-processor.js')
      signalCallbacks[signal]()

      expect(airbrake.flush).toHaveBeenCalled()
      process.on.mockRestore()
      process.exit.mockRestore()
    })
  })

  it.each([
    ['SIGINT', 130],
    ['SIGTERM', 137]
  ])('calls process.exit on %s signal with %i code', (signal, code) => {
    jest.isolateModules(() => {
      const signalCallbacks = {}
      jest.spyOn(process, 'on')
      jest.spyOn(process, 'exit')
      process.on.mockImplementation((signalToken, callback) => {
        signalCallbacks[signalToken] = callback
      })
      process.exit.mockImplementation(() => {})

      require('../recurring-payments-job.js')
      signalCallbacks[signal]()

      expect(process.exit).toHaveBeenCalledWith(code)
      process.on.mockRestore()
      process.exit.mockRestore()
    })
  })

  it('debug log displays "Recurring Payments job disabled" when env is false', async () => {
    process.env.RUN_RECURRING_PAYMENTS = 'false'

    await execute()

    expect(debugLogger).toHaveBeenCalledWith('Recurring Payments job disabled')
  })

  it('debug log displays "Recurring Payments job enabled" when env is true', async () => {
    await execute()

    expect(debugLogger).toHaveBeenCalledWith('Recurring Payments job enabled')
  })

  it('logs console error if Gov.UK Pay is not healthy', async () => {
    jest.spyOn(console, 'error')
    isGovPayUp.mockResolvedValueOnce(false)
    await execute()
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Run aborted, Gov.UK Pay health endpoint is reporting problems.'
      })
    )
    console.error.mockReset()
  })

  it('get recurring payments is called when env is true', async () => {
    const date = new Date().toISOString().split('T')[0]

    await execute()

    expect(salesApi.getDueRecurringPayments).toHaveBeenCalledWith(date)
  })

  it('debug log displays "Recurring Payments found:" when env is true', async () => {
    await execute()

    expect(debugLogger).toHaveBeenNthCalledWith(2, 'Recurring Payments found:', [])
  })

  describe('When RP fetch throws an error...', () => {
    it('calls console.error with error message', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      const error = new Error('Test error')
      salesApi.getDueRecurringPayments.mockImplementationOnce(() => {
        throw error
      })

      try {
        await execute()
      } catch {}

      expect(errorSpy).toHaveBeenCalledWith('Run aborted. Error fetching due recurring payments:', error)
    })
  })

  describe('HTTPRequestBatcher configuration', () => {
    it('creates batcher with default config when env vars are not set', async () => {
      setupSinglePayment()

      await execute()

      expect(HTTPRequestBatcher).toHaveBeenCalledWith({ batchSize: undefined, delay: undefined })
    })

    it('creates batcher with RCP_BATCHER_BATCH_SIZE from env when set', async () => {
      process.env.RCP_BATCHER_BATCH_SIZE = '10'
      setupSinglePayment()

      await execute()

      expect(HTTPRequestBatcher).toHaveBeenCalledWith(expect.objectContaining({ batchSize: 10 }))
    })

    it('creates batcher with RCP_BATCHER_DELAY_MS from env when set', async () => {
      process.env.RCP_BATCHER_DELAY_MS = '2000'
      setupSinglePayment()

      await execute()

      expect(HTTPRequestBatcher).toHaveBeenCalledWith(expect.objectContaining({ delay: 2000 }))
    })

    it('creates two separate batcher instances — one for creation, one for status', async () => {
      setupSinglePayment()

      await execute()

      expect(HTTPRequestBatcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('Payment creation via batcher', () => {
    it('calls addRequest for each due payment with the correct URL', async () => {
      const { creationBatcher } = setupSinglePayment()

      await execute()

      expect(creationBatcher.addRequest).toHaveBeenCalledWith(GOV_PAY_API_URL, expect.any(Object))
    })

    it('calls addRequest with correct method and headers', async () => {
      const { creationBatcher } = setupSinglePayment()

      await execute()

      expect(creationBatcher.addRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'post',
          headers: expect.objectContaining({
            accept: 'application/json',
            authorization: `Bearer ${GOV_PAY_RECURRING_APIKEY}`,
            'content-type': 'application/json'
          })
        })
      )
    })

    it('calls addRequest with the correct payment body', async () => {
      const agreementId = Symbol('agreementId')
      const transactionId = 'transactionId'

      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId, referenceNumber: 'foo' })])
      salesApi.createTransaction.mockReturnValueOnce({ cost: 50, id: transactionId, recurringPayment: { id: 'rp-1' } })

      const creationBatcher = makeBatcherMock([mockCreationOkResponse({ reference: transactionId })])
      const statusBatcher = makeBatcherMock([mockStatusOkResponse('pay-1', 'payment status success')])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      const expectedBody = JSON.stringify({
        amount: 5000,
        description: 'The recurring card payment for your rod fishing licence',
        reference: transactionId,
        authorisation_mode: 'agreement',
        agreement_id: agreementId
      })

      expect(creationBatcher.addRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: expectedBody })
      )
    })

    it('calls batcher.fetch() for payment creation', async () => {
      const { creationBatcher } = setupSinglePayment()

      await execute()

      expect(creationBatcher.fetch).toHaveBeenCalledTimes(1)
    })

    it('calls addRequest for all due payments, even if batch size is smaller', async () => {
      const agreementIds = ['agr-1', 'agr-2', 'agr-3', 'agr-4']
      salesApi.getDueRecurringPayments.mockReturnValueOnce(
        agreementIds.map((id, i) => getMockDueRecurringPayment({ agreementId: id, referenceNumber: `ref-${i}` }))
      )

      const permissionData = { licensee: { countryCode: 'GB-ENG' } }
      agreementIds.forEach((_, i) => {
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce(permissionData)
        salesApi.createTransaction.mockReturnValueOnce({ cost: 50, id: `trans-${i + 1}`, recurringPayment: { id: `rp-${i}` } })
      })

      const creationBatcher = makeBatcherMock(
        agreementIds.map((_, i) => mockCreationOkResponse({ payment_id: `pay-${i + 1}`, reference: `trans-${i + 1}` }))
      )
      const statusBatcher = makeBatcherMock(
        agreementIds.map((_, i) => mockStatusOkResponse(`pay-${i + 1}`, 'payment status success'))
      )
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      expect(creationBatcher.addRequest).toHaveBeenCalledTimes(4)
    })

    it('skips retry response if it does not exist in batcher responses', async () => {
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])

      // Only the 429 exists at position 0; no retry response at position N+0
      const creationBatcher = makeBatcherMock([mock429Response()])
      const statusBatcher = makeBatcherMock([])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      expect(salesApi.createPaymentJournal).not.toHaveBeenCalled()
    })

    it('falls back to position-based metadata when body.reference is not in the transaction map', async () => {
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
      salesApi.createTransaction.mockReturnValueOnce({ id: 'trans-1', cost: 30, recurringPayment: { id: 'rp-1' } })

      // body.reference does not match 'trans-1' → falls back to positional metadata
      const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: 'pay-1', reference: 'unexpected-ref' })])
      const statusBatcher = makeBatcherMock([mockStatusOkResponse('pay-1', PAYMENT_STATUS.Success)])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      expect(salesApi.createPaymentJournal).toHaveBeenCalledWith('trans-1', expect.any(Object))
    })

    it('skips 429 responses and processes the retry response', async () => {
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])

      // index 0: 429 (first attempt), index 1 (= N+0 retry): ok response
      const creationBatcher = makeBatcherMock([
        mock429Response(),
        mockCreationOkResponse({ payment_id: 'pay-retry', reference: 'test-transaction-id' })
      ])
      const statusBatcher = makeBatcherMock([mockStatusOkResponse('pay-retry', 'payment status success')])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      expect(salesApi.createPaymentJournal).toHaveBeenCalledWith(
        'test-transaction-id',
        expect.objectContaining({ paymentReference: 'pay-retry' })
      )
    })
  })

  describe('Payment status checks via batcher', () => {
    it('calls addRequest for each payment with the correct status check URL', async () => {
      const { statusBatcher, paymentId } = setupSinglePayment()

      await execute()

      expect(statusBatcher.addRequest).toHaveBeenCalledWith(`${GOV_PAY_API_URL}/${paymentId}`, expect.any(Object))
    })

    it('calls addRequest for status check with correct method and headers', async () => {
      const { statusBatcher } = setupSinglePayment()

      await execute()

      expect(statusBatcher.addRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'get',
          headers: expect.objectContaining({
            accept: 'application/json',
            authorization: `Bearer ${GOV_PAY_RECURRING_APIKEY}`,
            'content-type': 'application/json'
          })
        })
      )
    })

    it('calls batcher.fetch() for status checks', async () => {
      const { statusBatcher } = setupSinglePayment()

      await execute()

      expect(statusBatcher.fetch).toHaveBeenCalledTimes(1)
    })

    it('skips 429 responses during status check', async () => {
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
      const paymentId = 'pay-1'
      salesApi.createTransaction.mockReturnValueOnce({ id: 'trans-1', cost: 30, recurringPayment: { id: 'rp-1' } })

      const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: paymentId, reference: 'trans-1' })])
      const statusBatcher = makeBatcherMock([mock429Response(`${GOV_PAY_API_URL}/${paymentId}`)])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      expect(salesApi.processRPResult).not.toHaveBeenCalled()
      expect(salesApi.cancelRecurringPayment).not.toHaveBeenCalled()
    })

    it('processes status for all payments, even if some responses indicate errors', async () => {
      const dueRecurringPayments = Array.from({ length: 6 }, () => getMockDueRecurringPayment())

      salesApi.getDueRecurringPayments.mockReturnValueOnce(dueRecurringPayments)
      salesApi.preparePermissionDataForRenewal.mockResolvedValue({ licensee: { countryCode: 'GB-ENG' } })

      const paymentIds = dueRecurringPayments.map((_, i) => `pay-${i + 1}`)
      const transactionIds = dueRecurringPayments.map((_, i) => `trans-${i + 1}`)

      transactionIds.forEach((id, i) => {
        salesApi.createTransaction.mockReturnValueOnce({ id, cost: 30, recurringPayment: { id: `rp-${i}` } })
      })

      const creationBatcher = makeBatcherMock(
        paymentIds.map((pid, i) => mockCreationOkResponse({ payment_id: pid, reference: transactionIds[i] }))
      )
      const statusBatcher = makeBatcherMock(
        paymentIds.map((pid, i) => ([1, 3].includes(i) ? mockStatusErrorResponse(pid, 500) : mockStatusOkResponse(pid, 'payment status success')))
      )
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      // 4 successes → processRPResult called 4 times
      expect(salesApi.processRPResult).toHaveBeenCalledTimes(4)
    })
  })

  it('prepares the data for found recurring payments', async () => {
    const referenceNumber = Symbol('reference')
    setupSinglePayment({ referenceNumber })

    await execute()

    expect(salesApi.preparePermissionDataForRenewal).toHaveBeenCalledWith(referenceNumber)
  })

  it('creates a transaction with the correct data', async () => {
    const id = Symbol('recurring-payment-id')
    const agreementId = Symbol('agreement-id')

    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId, id })])

    const isLicenceForYou = Symbol('isLicenceForYou')
    const isRenewal = Symbol('isRenewal')
    const country = Symbol('country')
    const permitId = Symbol('permitId')
    const firstName = Symbol('firstName')
    const lastName = Symbol('lastName')

    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      isLicenceForYou,
      isRenewal,
      licensee: { firstName, lastName, country, countryCode: 'GB-ENG' },
      licenceStartDate: '2020-01-01',
      licenceStartTime: 3,
      permitId
    })

    const mockTransaction = { id: 'trans-1', cost: 30, recurringPayment: { id } }
    salesApi.createTransaction.mockReturnValueOnce(mockTransaction)

    const creationBatcher = makeBatcherMock([mockCreationOkResponse({ reference: 'trans-1' })])
    const statusBatcher = makeBatcherMock([mockStatusOkResponse('pay-1', 'payment status success')])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    const expectedData = {
      dataSource: 'Recurring Payment',
      recurringPayment: { agreementId, id },
      permissions: [
        {
          isLicenceForYou,
          isRenewal,
          issueDate: null,
          licensee: { firstName, lastName, country },
          permitId,
          startDate: '2020-01-01T03:00:00.000Z'
        }
      ]
    }

    await execute()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(expectedData)
  })

  it('creates a payment journal entry', async () => {
    const paymentId = 'unique-payment-id-under-test'
    const created_date = Symbol('created-date')
    const transactionId = Symbol('transaction-id')

    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockReturnValueOnce({ id: transactionId, cost: 99, recurringPayment: { id: 'rp-1' } })

    const creationBatcher = makeBatcherMock([
      mockCreationOkResponse({ payment_id: paymentId, reference: transactionId, created_date })
    ])
    const statusBatcher = makeBatcherMock([mockStatusOkResponse(paymentId, 'payment status success')])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(salesApi.createPaymentJournal).toHaveBeenCalledWith(
      transactionId,
      expect.objectContaining({
        paymentReference: paymentId,
        paymentTimestamp: created_date,
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      })
    )
  })

  it('strips the concession name returned by preparePermissionDataForRenewal before passing to createTransaction', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])

    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      licensee: { countryCode: 'GB-ENG' },
      concessions: [{ id: 'abc-123', name: 'concession-type-1', proof: { type: 'NO-PROOF' } }]
    })

    const creationBatcher = makeBatcherMock([mockCreationOkResponse()])
    const statusBatcher = makeBatcherMock([mockStatusOkResponse('pay-1', 'payment status success')])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: expect.arrayContaining([
          expect.objectContaining({
            concessions: expect.arrayContaining([expect.not.objectContaining({ name: 'concession-type-1' })])
          })
        ])
      })
    )
  })

  it('assigns the correct startDate when licenceStartTime is present', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      licensee: { countryCode: 'GB-ENG' },
      licenceStartDate: '2020-03-14',
      licenceStartTime: 15
    })

    const creationBatcher = makeBatcherMock([mockCreationOkResponse()])
    const statusBatcher = makeBatcherMock([mockStatusOkResponse('pay-1', 'payment status success')])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [expect.objectContaining({ startDate: '2020-03-14T15:00:00.000Z' })]
      })
    )
  })

  it('assigns the correct startDate when licenceStartTime is not present', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      licensee: { countryCode: 'GB-ENG' },
      licenceStartDate: '2020-03-14'
    })

    const creationBatcher = makeBatcherMock([mockCreationOkResponse()])
    const statusBatcher = makeBatcherMock([mockStatusOkResponse('pay-1', 'payment status success')])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [expect.objectContaining({ startDate: '2020-03-14T00:00:00.000Z' })]
      })
    )
  })

  it('should log payment status for recurring payment', async () => {
    const { paymentId } = setupSinglePayment({ paymentId: 'test-payment-id' })

    await execute()

    expect(debugLogger).toHaveBeenCalledWith(`Payment status for ${paymentId}: ${PAYMENT_STATUS.Success}`)
  })

  it('logs an error if createTransaction fails', async () => {
    jest.spyOn(console, 'error')
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    const error = new Error('Wuh-oh!')
    salesApi.createTransaction.mockImplementationOnce(() => {
      throw error
    })

    await execute()

    expect(console.error).toHaveBeenCalledWith(expect.any(String), error)
  })

  describe('When payment creation request results in an error response', () => {
    it('logs an error for a non-ok, non-Agreement response', async () => {
      jest.spyOn(console, 'error')
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])

      const creationBatcher = makeBatcherMock([mockCreationErrorResponse({ status: 500, description: 'Internal Server Error' })])
      const statusBatcher = makeBatcherMock([])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Unexpected response from GOV.UK Pay API'))
    })

    it('prepares and sends all payment requests, even if some fail', async () => {
      const agreementIds = ['agr-1', 'agr-2', 'agr-3', 'agr-4']
      salesApi.getDueRecurringPayments.mockReturnValueOnce(
        agreementIds.map((id, i) => getMockDueRecurringPayment({ agreementId: id, referenceNumber: `ref-${i}` }))
      )

      const permissionData = { licensee: { countryCode: 'GB-ENG' } }
      agreementIds.forEach((_, i) => {
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce(permissionData)
        salesApi.createTransaction.mockReturnValueOnce({ cost: 50, id: `trans-${i + 1}`, recurringPayment: { id: `rp-${i}` } })
      })

      const creationBatcher = makeBatcherMock([
        mockCreationOkResponse({ payment_id: 'pay-1', reference: 'trans-1' }),
        mockCreationErrorResponse({ status: 500, description: 'Gateway down' }),
        mockCreationOkResponse({ payment_id: 'pay-3', reference: 'trans-3' }),
        mockCreationOkResponse({ payment_id: 'pay-4', reference: 'trans-4' })
      ])
      const statusBatcher = makeBatcherMock([
        mockStatusOkResponse('pay-1', 'payment status success'),
        mockStatusOkResponse('pay-3', 'payment status success'),
        mockStatusOkResponse('pay-4', 'payment status success')
      ])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      expect(creationBatcher.addRequest).toHaveBeenCalledTimes(4)
    })

    it('logs errors for every failed transaction creation', async () => {
      jest.spyOn(console, 'error')
      const errors = [new Error('error 1'), new Error('error 2'), new Error('error 3')]
      salesApi.getDueRecurringPayments.mockReturnValueOnce([
        getMockDueRecurringPayment({ referenceNumber: 'fee', agreementId: 'a1' }),
        getMockDueRecurringPayment({ referenceNumber: 'fi', agreementId: 'a2' }),
        getMockDueRecurringPayment({ referenceNumber: 'foe', agreementId: 'a3' })
      ])
      const permissionData = { licensee: { countryCode: 'GB-ENG' } }
      salesApi.preparePermissionDataForRenewal
        .mockRejectedValueOnce(errors[0])
        .mockReturnValueOnce(permissionData)
        .mockReturnValueOnce(permissionData)
      salesApi.createTransaction.mockRejectedValueOnce(errors[1]).mockRejectedValueOnce(errors[2])

      await execute()

      expect(console.error).toHaveBeenCalledWith(expect.any(String), ...errors)
    })

    describe('when the error is caused by an invalid agreementId', () => {
      it('logs out the ids', async () => {
        jest.spyOn(console, 'log')
        salesApi.getDueRecurringPayments.mockReturnValueOnce(getMockPaymentRequestResponse())

        const creationBatcher = makeBatcherMock([
          mockCreationErrorResponse({
            status: 422,
            description: 'Invalid attribute value: agreement_id. Agreement does not exist'
          })
        ])
        const statusBatcher = makeBatcherMock([])
        HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

        await execute()

        expect(console.log).toHaveBeenCalledWith(
          '%s is an invalid agreementId. Recurring payment %s will be cancelled',
          'agreement-1',
          'recurring-payment-1'
        )
      })

      it('cancels the recurring payment', async () => {
        salesApi.getDueRecurringPayments.mockReturnValueOnce(getMockPaymentRequestResponse())

        const creationBatcher = makeBatcherMock([
          mockCreationErrorResponse({
            status: 422,
            description: 'Invalid attribute value: agreement_id. Agreement does not exist'
          })
        ])
        const statusBatcher = makeBatcherMock([])
        HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

        await execute()

        expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith('recurring-payment-1')
      })
    })

    describe('when the error response is NOT caused by an invalid agreementId', () => {
      it('does not try to cancel the recurring payment', async () => {
        salesApi.getDueRecurringPayments.mockReturnValueOnce(getMockPaymentRequestResponse())

        const creationBatcher = makeBatcherMock([
          mockCreationErrorResponse({ status: 500, description: 'The moon blew up without warning' })
        ])
        const statusBatcher = makeBatcherMock([])
        HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

        await execute()

        expect(salesApi.cancelRecurringPayment).not.toHaveBeenCalled()
      })
    })
  })

  it('should log errors from await salesApi.processRPResult', async () => {
    const { paymentId, transactionId } = setupSinglePayment({ transactionId: 'trans-1', paymentId: 'pay-1' })
    const boom = new Error('boom')
    salesApi.processRPResult.mockImplementation(transId => (transId === transactionId ? Promise.reject(boom) : Promise.resolve()))

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await execute()

    expect(errorSpy).toHaveBeenCalledWith(`Failed to process Recurring Payment for ${transactionId}`, boom)

    errorSpy.mockRestore()
  })

  describe('handling failures for multiple due payments', () => {
    beforeEach(() => {
      salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment(), getMockDueRecurringPayment()])
      salesApi.preparePermissionDataForRenewal.mockResolvedValueOnce({ licensee: { countryCode: 'GB-ENG' } })
      salesApi.createTransaction
        .mockResolvedValueOnce({ id: 'trans-1', cost: 30, recurringPayment: { id: 'rp-1' } })
        .mockResolvedValueOnce({ id: 'trans-2', cost: 30, recurringPayment: { id: 'rp-2' } })
    })

    it('continues when one creation batcher response is an error', async () => {
      const creationBatcher = makeBatcherMock([
        mockCreationErrorResponse({ status: 500, description: 'gateway down' }),
        mockCreationOkResponse({ payment_id: 'pay-2', reference: 'trans-2', created_date: '2025-01-01T00:01:00.000Z' })
      ])
      const statusBatcher = makeBatcherMock([mockStatusOkResponse('pay-2', 'payment status success')])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      salesApi.processRPResult.mockResolvedValueOnce()

      await execute()

      expect(salesApi.processRPResult).toHaveBeenCalledWith('trans-2', 'pay-2', '2025-01-01T00:01:00.000Z')
      expect(salesApi.processRPResult).toHaveBeenCalledTimes(1)
    })

    it('continues when processRPResult rejects for one payment', async () => {
      const creationBatcher = makeBatcherMock([
        mockCreationOkResponse({ payment_id: 'pay-1', reference: 'trans-1', created_date: '2025-01-01T00:00:00.000Z' }),
        mockCreationOkResponse({ payment_id: 'pay-2', reference: 'trans-2', created_date: '2025-01-01T00:01:00.000Z' })
      ])
      const statusBatcher = makeBatcherMock([
        mockStatusOkResponse('pay-1', 'payment status success'),
        mockStatusOkResponse('pay-2', 'payment status success')
      ])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      const boom = new Error('boom')
      salesApi.processRPResult.mockImplementation(transId => (transId === 'trans-1' ? Promise.reject(boom) : Promise.resolve()))

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await execute()

      expect(salesApi.processRPResult).toHaveBeenCalledTimes(2)
      expect(errorSpy).toHaveBeenCalledWith('Failed to process Recurring Payment for trans-1', boom)

      errorSpy.mockRestore()
    })

    it('does not abort when a status response is non-ok for one payment', async () => {
      const creationBatcher = makeBatcherMock([
        mockCreationOkResponse({ payment_id: 'pay-1', reference: 'trans-1', created_date: '2025-01-01T00:00:00.000Z' }),
        mockCreationOkResponse({ payment_id: 'pay-2', reference: 'trans-2', created_date: '2025-01-01T00:01:00.000Z' })
      ])
      const statusBatcher = makeBatcherMock([
        mockStatusErrorResponse('pay-1', 500),
        mockStatusOkResponse('pay-2', 'payment status success')
      ])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      salesApi.processRPResult.mockResolvedValueOnce()

      await execute()

      expect(salesApi.processRPResult).toHaveBeenCalledWith('trans-2', 'pay-2', '2025-01-01T00:01:00.000Z')
      expect(salesApi.processRPResult).toHaveBeenCalledTimes(1)
    })
  })

  it.each([
    [400, 'Failed to fetch status for payment test-payment-id, error 400'],
    [486, 'Failed to fetch status for payment test-payment-id, error 486'],
    [499, 'Failed to fetch status for payment test-payment-id, error 499'],
    [500, 'Payment status API error for test-payment-id, error 500'],
    [512, 'Payment status API error for test-payment-id, error 512'],
    [599, 'Payment status API error for test-payment-id, error 599']
  ])('logs the correct message when status response is HTTP %i', async (statusCode, expectedMessage) => {
    jest.spyOn(console, 'error')
    const paymentId = 'test-payment-id'
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockReturnValueOnce({ id: 'trans-1', cost: 30, recurringPayment: { id: 'rp-1' } })

    const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: paymentId, reference: 'trans-1' })])
    const statusBatcher = makeBatcherMock([mockStatusErrorResponse(paymentId, statusCode)])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(console.error).toHaveBeenCalledWith(expectedMessage)
  })

  it('logs the generic unexpected-error message when status response throws unexpectedly', async () => {
    jest.spyOn(console, 'error')
    const paymentId = 'test-payment-id'
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockReturnValueOnce({ id: 'trans-1', cost: 30, recurringPayment: { id: 'rp-1' } })

    const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: paymentId, reference: 'trans-1' })])

    // Status response's json() throws unexpectedly (no response.status on error)
    const statusBatcher = makeBatcherMock([
      {
        ok: true,
        status: 200,
        url: `${GOV_PAY_API_URL}/${paymentId}`,
        json: jest.fn().mockRejectedValue(new Error('network meltdown'))
      }
    ])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(console.error).toHaveBeenCalledWith(`Unexpected error fetching payment status for ${paymentId}.`)
  })

  it('should call setTimeout with correct delay when there are recurring payments', async () => {
    setupSinglePayment()
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())

    await execute()

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), PAYMENT_STATUS_DELAY)
  })

  it('should not call setTimeout when there are no recurring payments', async () => {
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([])
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())

    await execute()

    expect(setTimeoutSpy).not.toHaveBeenCalled()
  })

  it('calls processRPResult with transaction id, payment id and created date when payment is successful', async () => {
    const { paymentId, transactionId, created_date } = setupSinglePayment({
      transactionId: 'test-transaction-id',
      paymentId: 'test-payment-id',
      created_date: '2025-01-01T00:00:00.000Z'
    })

    await execute()

    expect(salesApi.processRPResult).toHaveBeenCalledWith(transactionId, paymentId, created_date)
  })

  it("doesn't call processRPResult if payment status is not successful", async () => {
    setupSinglePayment({ paymentStatus: 'payment status failure' })

    await execute()

    expect(salesApi.processRPResult).not.toHaveBeenCalled()
  })

  it.each([
    ['agreement-id', getPaymentStatusFailure(), 'failure'],
    ['test-agreement-id', getPaymentStatusFailure(), 'failure'],
    ['another-agreement-id', getPaymentStatusFailure(), 'failure'],
    ['agreement-id', getPaymentStatusError(), 'error'],
    ['test-agreement-id', getPaymentStatusError(), 'error'],
    ['another-agreement-id', getPaymentStatusError(), 'error']
  ])(
    'console error displays "Payment failed. Recurring payment agreement for: %s set to be cancelled" when payment is a %status',
    async (agreementId, mockStatus, status) => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId })])

      const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: 'pay-1', reference: 'test-transaction-id' })])
      const statusBatcher = makeBatcherMock([
        {
          ok: true,
          status: 200,
          url: `${GOV_PAY_API_URL}/pay-1`,
          json: jest.fn().mockResolvedValue(mockStatus)
        }
      ])
      HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

      await execute()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Payment failed. Recurring payment agreement for: ${agreementId} set to be cancelled. Updating payment journal.`
      )
    }
  )

  it.each([
    ['agreement-id', getPaymentStatusFailure()],
    ['test-agreement-id', getPaymentStatusError()]
  ])('updates payment journal to Failed when payment agreement %s has a failure/error status', async (agreementId, mockStatus) => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId })])
    salesApi.getPaymentJournal.mockResolvedValueOnce({ id: 'journal-1' })

    const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: 'pay-1', reference: 'test-transaction-id' })])
    const statusBatcher = makeBatcherMock([
      { ok: true, status: 200, url: `${GOV_PAY_API_URL}/pay-1`, json: jest.fn().mockResolvedValue(mockStatus) }
    ])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith(
      'test-transaction-id',
      expect.objectContaining({ paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
    )
  })

  it.each([
    ['agreement-id', getPaymentStatusFailure()],
    ['test-agreement-id', getPaymentStatusError()]
  ])('cancels the recurring payment when agreement %s has a failure/error status', async (agreementId, mockStatus) => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId })])
    salesApi.getPaymentJournal.mockResolvedValueOnce({ id: 'journal-1' })

    const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: 'pay-1', reference: 'test-transaction-id' })])
    const statusBatcher = makeBatcherMock([
      { ok: true, status: 200, url: `${GOV_PAY_API_URL}/pay-1`, json: jest.fn().mockResolvedValue(mockStatus) }
    ])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith('recurring-payment-1')
  })

  it('logs an error if a status response URL contains an unknown paymentId', async () => {
    jest.spyOn(console, 'error')
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockReturnValueOnce({ id: 'trans-1', cost: 30, recurringPayment: { id: 'rp-1' } })

    const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: 'pay-1', reference: 'trans-1' })])
    const statusBatcher = makeBatcherMock([
      { ok: true, status: 200, url: `${GOV_PAY_API_URL}/pay-unknown`, json: jest.fn().mockResolvedValue({ state: { status: 'success' } }) }
    ])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(console.error).toHaveBeenCalledWith('Could not find payment data for paymentId: pay-unknown')
  })

  it('logs a generic error when a status response has an unexpected HTTP status (not 4xx or 5xx)', async () => {
    jest.spyOn(console, 'error')
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockReturnValueOnce({ id: 'trans-1', cost: 30, recurringPayment: { id: 'rp-1' } })

    const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: 'pay-1', reference: 'trans-1' })])
    const statusBatcher = makeBatcherMock([{ ok: false, status: 304, url: `${GOV_PAY_API_URL}/pay-1`, json: jest.fn() }])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(console.error).toHaveBeenCalledWith('Unexpected error fetching payment status for pay-1.')
  })

  it.each([
    [400, 'Failed to fetch status for payment test-payment-id, error 400'],
    [500, 'Payment status API error for test-payment-id, error 500']
  ])('logs correct error when processRPResult throws with error.response.status %i', async (responseStatus, expectedMessage) => {
    jest.spyOn(console, 'error')
    const paymentId = 'test-payment-id'
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockReturnValueOnce({ id: 'trans-1', cost: 30, recurringPayment: { id: 'rp-1' } })

    const err = new Error('API error')
    err.response = { status: responseStatus }
    salesApi.processRPResult.mockRejectedValueOnce(err)

    const creationBatcher = makeBatcherMock([mockCreationOkResponse({ payment_id: paymentId, reference: 'trans-1' })])
    const statusBatcher = makeBatcherMock([mockStatusOkResponse(paymentId, PAYMENT_STATUS.Success)])
    HTTPRequestBatcher.mockImplementationOnce(() => creationBatcher).mockImplementationOnce(() => statusBatcher)

    await execute()

    expect(console.error).toHaveBeenCalledWith(expectedMessage)
  })
})
