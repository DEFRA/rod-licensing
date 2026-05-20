import { airbrake, salesApi, HTTPRequestBatcher } from '@defra-fish/connectors-lib'
import { PAYMENT_STATUS, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { execute } from '../recurring-payments-processor.js'
import { isGovPayUp, queueRecurringPayment, queueRecurringPaymentStatusCheck } from '../services/govuk-pay-service.js'
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
      recurringPayment: {
        id: 'recurring-payment-1'
      }
    })),
    getDueRecurringPayments: jest.fn(() => []),
    getPaymentJournal: jest.fn(),
    preparePermissionDataForRenewal: jest.fn(() => ({
      licensee: { countryCode: 'GB-ENG' }
    })),
    processRPResult: jest.fn(),
    updatePaymentJournal: jest.fn()
  },
  HTTPRequestBatcher: jest.fn(function () {
    this.addRequest = jest.fn()
    this.fetch = jest.fn()
    this.responses = [{ status: 200, json: () => Promise.resolve(getMockSendPaymentResponse()) }]
  })
}))
jest.mock('../services/govuk-pay-service.js', () => ({
  queueRecurringPayment: jest.fn(() => ({ fetch: jest.fn() })),
  queueRecurringPaymentStatusCheck: jest.fn(),
  isGovPayUp: jest.fn(() => true)
}))

jest.mock('debug', () => jest.fn(() => jest.fn()))

const PAYMENT_STATUS_DELAY = 60000
const getPaymentStatusSuccess = (additionalFields = {}) => ({ state: { status: PAYMENT_STATUS.Success }, ...additionalFields })
const getPaymentStatusFailure = () => ({ state: { status: PAYMENT_STATUS.Failure } })
const getPaymentStatusError = () => ({ state: { status: PAYMENT_STATUS.Error } })
const getMockDueRecurringPayment = ({ agreementId = 'test-agreement-id', id = 'abc-123', referenceNumber = 'ref-1' } = {}) => ({
  entity: { id, agreementId },
  expanded: { activePermission: { entity: { referenceNumber } } }
})
/* eslint-disable camelcase */
const getMockSendPaymentResponse = ({
  payment_id = 'pay-1',
  created_date = '2025-01-01T00:00:00.000Z',
  agreement_id = 'test-agreement-id',
  state = { status: 'created' },
  description = ''
} = {}) => ({
  payment_id,
  created_date,
  agreement_id,
  state,
  description
})
/* eslint-enable camelcase */
const mockBatchers = ({ paymentResponses = [], statusResponses = [] } = {}) =>
  HTTPRequestBatcher.mockImplementationOnce(getBatcherImplementation(paymentResponses)).mockImplementationOnce(
    getBatcherImplementation(statusResponses)
  )

const getBatcherImplementation = (responses = []) => {
  return function () {
    this.addRequest = jest.fn()
    this.fetch = jest.fn(() => {
      this.responses = responses
    })
    Object.defineProperty(this, 'requestQueue', {
      get: () => {
        const requestQueue = Array(100)
        requestQueue.fill({
          options: {
            body: '{ "value" : "Sample Payload" }'
          }
        })
        return requestQueue
      }
    })
  }
}
// have to go through all tests and check due payments are matching HTTP batcher responses
describe('recurring-payments-processor', () => {
  const [{ value: debugLogger }] = db.mock.results

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RUN_RECURRING_PAYMENTS = 'true'
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
      // setup a delay so script doesn't call processRecurringPayments and exit naturally
      process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '1'
      const signalCallbacks = {}
      jest.spyOn(process, 'on')
      jest.spyOn(process, 'exit')
      process.on.mockImplementation((signalToken, callback) => {
        signalCallbacks[signalToken] = callback
      })
      process.exit.mockImplementation(() => {
        // so we don't crash out of the tests!
      })

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
      process.exit.mockImplementation(() => {
        // so we don't crash out of the tests!
      })

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

  it('When RP fetch throws an error, console.error is called with error message', async () => {
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

  describe('When payment request throws an error...', () => {
    it('subsequent payment requests are still sent', async () => {
      const agreementIds = [
        '45f0ac55-9638-426f-b8f6-154cd8eda5fc',
        '086f1185-acae-4b7a-a362-3eca973c36f9',
        '094ad13c-4d77-4ed1-98e9-47844f998571',
        '208a3f88-7753-45d6-a642-172db734cd73'
      ]
      salesApi.getDueRecurringPayments.mockReturnValueOnce([
        getMockDueRecurringPayment({ referenceNumber: 'fee', agreementId: agreementIds[0] }),
        getMockDueRecurringPayment({ referenceNumber: 'fi', agreementId: agreementIds[1] }),
        getMockDueRecurringPayment({ referenceNumber: 'foe', agreementId: agreementIds[2] }),
        getMockDueRecurringPayment({ referenceNumber: 'fum', agreementId: agreementIds[3] })
      ])

      const permissionData = { licensee: { countryCode: 'GB-ENG' } }
      const requestPaymentResponses = []
      const requestPaymentStatusResponses = new Array(agreementIds.length - 1).fill(getPaymentStatusSuccess(), 0, agreementIds.length - 1)
      for (let x = 0; x < agreementIds.length; x++) {
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce(permissionData)
        salesApi.createTransaction.mockReturnValueOnce({
          cost: 50,
          id: `transaction-id-${x + 1}`
        })

        if (x === 1) {
          requestPaymentResponses.push(new Error('Payment request failed'))
        } else {
          requestPaymentResponses.push({
            status: 200,
            json: () => Promise.resolve({ payment_id: `test-payment-id-${x + 1}`, agreement_id: agreementIds[x] })
          })
        }
      }
      const expectedData = {
        amount: 5000,
        description: 'The recurring card payment for your rod fishing licence',
        reference: 'transactionId',
        authorisation_mode: 'agreement'
      }
      mockBatchers({ paymentResponses: requestPaymentResponses, statusResponses: requestPaymentStatusResponses })

      await execute()

      expect(queueRecurringPayment).toHaveBeenCalledTimes(4)
      expect(queueRecurringPayment).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ ...expectedData, reference: 'transaction-id-1', agreement_id: agreementIds[0] }),
        expect.anything()
      )
      expect(queueRecurringPayment).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ ...expectedData, reference: 'transaction-id-2', agreement_id: agreementIds[1] }),
        expect.anything()
      )
      expect(queueRecurringPayment).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ ...expectedData, reference: 'transaction-id-3', agreement_id: agreementIds[2] }),
        expect.anything()
      )
      expect(queueRecurringPayment).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({ ...expectedData, reference: 'transaction-id-4', agreement_id: agreementIds[3] }),
        expect.anything()
      )
    })

    it('logs an error for create transaction failures', async () => {
      jest.spyOn(console, 'error')
      const errors = [new Error('error 1'), new Error('error 2')]
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
      salesApi.createTransaction.mockRejectedValueOnce(errors[1]).mockReturnValueOnce({ cost: 50, id: 'transaction-id-3' })
      HTTPRequestBatcher.mockImplementationOnce(
        getBatcherImplementation([
          { status: 200, json: () => Promise.resolve({ payment_id: 'payment-id-1', agreement_id: 'agreement-id-1', description: '' }) },
          { status: 200, json: () => Promise.resolve({ payment_id: 'payment-id-2', agreement_id: 'agreement-id-2', description: '' }) }
        ])
      )
      // no need to mock returns for payment status batcher as we are only testing transaction creation errors here

      await execute()

      expect(console.error).toHaveBeenCalledWith(expect.any(String), ...errors)
    })

    it('logs an error for every failed payment', async () => {
      jest.spyOn(console, 'error')
      salesApi.getDueRecurringPayments.mockReturnValueOnce([
        getMockDueRecurringPayment({ referenceNumber: 'fee', agreementId: 'a1' }),
        getMockDueRecurringPayment({ referenceNumber: 'fi', agreementId: 'a2' }),
        getMockDueRecurringPayment({ referenceNumber: 'foe', agreementId: 'a3' }),
        getMockDueRecurringPayment({ referenceNumber: 'fum', agreementId: 'a4' })
      ])
      mockBatchers({
        paymentResponses: [
          { status: 200, json: () => Promise.resolve(getMockSendPaymentResponse({ agreement_id: 'a1' })) },
          new Error('Payment request failed'),
          { status: 200, json: () => Promise.resolve(getMockSendPaymentResponse({ agreement_id: 'a3' })) },
          { status: 200, json: () => Promise.resolve(getMockSendPaymentResponse({ agreement_id: 'a4' })) }
        ],
        statusResponses: [
          { status: 200, json: () => Promise.resolve(getPaymentStatusSuccess()) },
          { status: 200, json: () => Promise.resolve(getPaymentStatusSuccess()) },
          { status: 200, json: () => Promise.resolve(getPaymentStatusSuccess()) }
        ]
      })

      await execute()
      expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/Unexpected response from GOV.UK Pay API\..*/))
    })

    describe.each(['must be active', 'does not exist'])('when the error is caused by an invalid agreementId', errorMessageFragment => {
      it('logs out the ids when agreement %s', async () => {
        jest.spyOn(console, 'log')
        const agreementId = 'abc-123'
        const referenceNumber = 'def-456'
        salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId, referenceNumber })])
        salesApi.createTransaction.mockResolvedValueOnce({
          recurringPayment: {
            id: referenceNumber
          }
        })
        HTTPRequestBatcher.mockImplementationOnce(
          getBatcherImplementation([
            {
              status: 400,
              json: () =>
                Promise.resolve({
                  field: 'agreement_id',
                  code: 'P0102',
                  description: `Invalid attribute value: abc-123. Agreement ${errorMessageFragment}`
                })
            }
          ])
        )

        await execute()

        expect(console.log).toHaveBeenCalledWith(
          '%s is an invalid agreementId. Recurring payment %s will be cancelled',
          agreementId,
          referenceNumber
        )
      })

      it('cancels the recurring payment', async () => {
        const agreementId = 'abc-123'
        const referenceNumber = 'def-456'
        salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId, referenceNumber })])
        salesApi.createTransaction.mockResolvedValueOnce({
          recurringPayment: {
            id: referenceNumber
          }
        })
        HTTPRequestBatcher.mockImplementationOnce(
          getBatcherImplementation([
            {
              status: 400,
              json: () =>
                Promise.resolve({
                  field: 'agreement_id',
                  code: 'P0102',
                  description: `Invalid attribute value: abc-123. Agreement ${errorMessageFragment}`
                })
            }
          ])
        )

        await execute()

        expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith(referenceNumber)
      })
    })

    it('when the error is caused by a reason other than invalid agreementId, RP is not cancelled', async () => {
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
      HTTPRequestBatcher.mockImplementationOnce(
        getBatcherImplementation([
          {
            status: 400,
            json: () => Promise.resolve({ code: 'B00M', description: 'The moon blew up without warning and for no apparent reason' })
          }
        ])
      )

      try {
        await execute()
      } finally {
        expect(salesApi.cancelRecurringPayment).not.toHaveBeenCalledWith('recurring-payment-1')
      }
    })
  })

  describe.each([
    [
      4,
      'errors',
      [
        { status: 200, paymentId: Symbol('pay-1') },
        { status: 200, paymentId: Symbol('pay-2') },
        new Error('Payment request failed'),
        { status: 200, paymentId: Symbol('pay-3') },
        new Error('Payment request failed'),
        { status: 200, paymentId: Symbol('pay-4') }
      ]
    ],
    [
      3,
      '429 and 500 responses',
      [
        { status: 200, paymentId: Symbol('pay-5') },
        { status: 429 },
        { status: 500 },
        { status: 200, paymentId: Symbol('pay-6') },
        { status: 201, paymentId: Symbol('pay-7') }
      ]
    ]
  ])(
    'processRecurringPayments requests payment status for all %i successful payments when responses include %s',
    (expectedStatusCallCount, _d, responses) => {
      it('queues a payment status check for each successful payment response', async () => {
        const paymentIds = responses.filter(r => r.paymentId).map(r => r.paymentId)
        for (const response of responses) {
          if (response.paymentId) {
            response.json = () => Promise.resolve(getMockSendPaymentResponse({ payment_id: response.paymentId }))
          }
        }
        salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
        HTTPRequestBatcher.mockImplementationOnce(getBatcherImplementation(responses))

        await execute()

        const [, paymentStatusBatcher] = HTTPRequestBatcher.mock.instances
        paymentIds.forEach((paymentId, idx) => {
          expect(queueRecurringPaymentStatusCheck).toHaveBeenNthCalledWith(idx + 1, paymentId, paymentStatusBatcher)
        })
      })

      it('initiates the batcher to retrieve payment statuses', async () => {
        for (const response of responses) {
          if (response.paymentId) {
            response.json = () => Promise.resolve(getMockSendPaymentResponse({ payment_id: response.paymentId }))
          }
        }
        salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
        HTTPRequestBatcher.mockImplementationOnce(getBatcherImplementation(responses))

        await execute()

        const [, paymentStatusBatcher] = HTTPRequestBatcher.mock.instances
        expect(paymentStatusBatcher.fetch).toHaveBeenCalled()
      })
    }
  )

  it('prepares the data for found recurring payments', async () => {
    const referenceNumber = Symbol('reference')
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ referenceNumber })])

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
      licensee: {
        firstName,
        lastName,
        country,
        countryCode: 'GB-ENG'
      },
      licenceStartDate: '2020-01-01',
      licenceStartTime: 3,
      permitId
    })

    const expectedData = {
      dataSource: 'Recurring Payment',
      recurringPayment: {
        agreementId,
        id
      },
      permissions: [
        {
          isLicenceForYou,
          isRenewal,
          issueDate: null,
          licensee: {
            firstName,
            lastName,
            country
          },
          permitId,
          startDate: '2020-01-01T03:00:00.000Z'
        }
      ]
    }

    await execute()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(expectedData)
  })

  it('creates a payment journal entry', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    const samplePayment = {
      payment_id: Symbol('payment-id'),
      created_date: Symbol('created-date')
    }
    const sampleTransaction = {
      id: Symbol('transaction-id'),
      cost: 99
    }
    HTTPRequestBatcher.mockImplementationOnce(
      getBatcherImplementation([
        {
          status: 200,
          json: () =>
            Promise.resolve(
              getMockSendPaymentResponse(
                getPaymentStatusSuccess({
                  payment_id: samplePayment.payment_id,
                  created_date: samplePayment.created_date,
                  reference: sampleTransaction.id
                })
              )
            )
        }
      ])
    )
    salesApi.createTransaction.mockResolvedValueOnce(sampleTransaction)

    await execute()

    expect(salesApi.createPaymentJournal).toHaveBeenCalledWith(
      sampleTransaction.id,
      expect.objectContaining({
        paymentReference: samplePayment.payment_id,
        paymentTimestamp: samplePayment.created_date,
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      })
    )
  })

  it('creates a payment journal entry that corresponds to the correct payment and transaction when any 2xx response received', async () => {
    const paymentIds = [Symbol('pay-1'), Symbol('pay-3'), Symbol('pay-5'), Symbol('pay-6'), Symbol('pay-9')]
    const responses = [
      { status: 200, json: () => Promise.resolve(getMockSendPaymentResponse({ payment_id: paymentIds[0] })) },
      new Error('Payment request failed'),
      { status: 201, json: () => Promise.resolve(getMockSendPaymentResponse({ payment_id: paymentIds[1] })) },
      new Error('Payment request failed'),
      { status: 210, json: () => Promise.resolve(getMockSendPaymentResponse({ payment_id: paymentIds[2] })) },
      { status: 222, json: () => Promise.resolve(getMockSendPaymentResponse({ payment_id: paymentIds[3] })) },
      { status: 429, json: () => Promise.resolve({ field: '', code: 'P0900', description: 'Calm it down a bit' }) },
      { status: 500, json: () => Promise.resolve({ description: 'BOOM!' }) },
      { status: 299, json: () => Promise.resolve(getMockSendPaymentResponse({ payment_id: paymentIds[4] })) }
    ]
    salesApi.getDueRecurringPayments.mockReturnValueOnce(
      new Array(responses.length).fill(getMockDueRecurringPayment(), 0, responses.length)
    )
    HTTPRequestBatcher.mockImplementationOnce(getBatcherImplementation(responses))
    for (let x = 0; x < responses.length; x++) {
      salesApi.createTransaction.mockResolvedValueOnce({ id: `transaction-${x + 1}` })
    }

    await execute()

    expect(salesApi.createPaymentJournal).toHaveBeenNthCalledWith(
      1,
      'transaction-1',
      expect.objectContaining({
        paymentReference: paymentIds[0],
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      })
    )
    expect(salesApi.createPaymentJournal).toHaveBeenNthCalledWith(
      2,
      'transaction-3',
      expect.objectContaining({
        paymentReference: paymentIds[1],
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      })
    )
    expect(salesApi.createPaymentJournal).toHaveBeenNthCalledWith(
      3,
      'transaction-5',
      expect.objectContaining({
        paymentReference: paymentIds[2],
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      })
    )
    expect(salesApi.createPaymentJournal).toHaveBeenNthCalledWith(
      4,
      'transaction-6',
      expect.objectContaining({
        paymentReference: paymentIds[3],
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      })
    )
    expect(salesApi.createPaymentJournal).toHaveBeenNthCalledWith(
      5,
      'transaction-9',
      expect.objectContaining({
        paymentReference: paymentIds[4],
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      })
    )
  })

  it('strips the concession name returned by preparePermissionDataForRenewal before passing to createTransaction', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])

    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      licensee: {
        countryCode: 'GB-ENG'
      },
      concessions: [
        {
          id: 'abc-123',
          name: 'concession-type-1',
          proof: { type: 'NO-PROOF' }
        }
      ]
    })

    await execute()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: expect.arrayContaining([
          expect.objectContaining({
            concessions: expect.arrayContaining([
              expect.not.objectContaining({
                name: 'concession-type-1'
              })
            ])
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

    await execute()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [expect.objectContaining({ startDate: '2020-03-14T00:00:00.000Z' })]
      })
    )
  })

  describe.each([
    ['request payment', 1],
    ['get payment status', 2]
  ])('HTTPRequestBatcher instantiation for %s', (_d, callNumber) => {
    it.each([23, 202, 1])('has expected batch size (%i)', async batchSize => {
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
      process.env.GOV_PAY_GET_BATCH_SIZE = batchSize
      await execute()
      expect(HTTPRequestBatcher).toHaveBeenNthCalledWith(callNumber, expect.objectContaining({ batchSize }))
    })

    it.each([1000, 12, 3600])('has expected batch delay (%i)', async delay => {
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
      process.env.GOV_PAY_BATCH_DELAY_MS = delay
      await execute()
      expect(HTTPRequestBatcher).toHaveBeenNthCalledWith(callNumber, expect.objectContaining({ delay }))
    })
  })

  it('prepares and queues the payment request', async () => {
    const transactionId = 'transactionId'
    const duePayment = getMockDueRecurringPayment()
    salesApi.getDueRecurringPayments.mockReturnValueOnce([duePayment])
    HTTPRequestBatcher.mockImplementationOnce(
      getBatcherImplementation([{ json: Promise.resolve({ payment_id: 'test-payment-id', agreement_id: duePayment.entity.agreementId }) }])
    )
    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      licensee: { countryCode: 'GB-ENG' }
    })
    salesApi.createTransaction.mockReturnValueOnce({
      cost: 50,
      id: transactionId
    })

    const expectedData = {
      amount: 5000,
      description: 'The recurring card payment for your rod fishing licence',
      reference: transactionId,
      authorisation_mode: 'agreement',
      agreement_id: duePayment.entity.agreementId
    }

    await execute()

    expect(queueRecurringPayment).toHaveBeenCalledWith(expectedData, expect.any(HTTPRequestBatcher))
  })

  it('should log payment status for recurring payment', async () => {
    const mockPaymentId = 'test-payment-id'
    const mockResponse = [
      {
        entity: { agreementId: 'agreement-1' },
        expanded: {
          activePermission: {
            entity: {
              referenceNumber: 'ref-1'
            }
          }
        }
      }
    ]
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(mockResponse)
    salesApi.createTransaction.mockResolvedValueOnce({
      id: mockPaymentId
    })
    mockBatchers({
      paymentResponses: [{ status: 200, json: () => Promise.resolve({ payment_id: mockPaymentId, agreement_id: 'agreement-1' }) }],
      statusResponses: [{ status: 200, json: () => Promise.resolve(getPaymentStatusSuccess({ payment_id: mockPaymentId })) }]
    })

    await execute()

    expect(debugLogger).toHaveBeenCalledWith(`Payment status for ${mockPaymentId}: ${PAYMENT_STATUS.Success}`)
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

  it('should log errors from salesApi.processRPResult', async () => {
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockResolvedValueOnce({ id: 'trans-1', cost: 30 })
    mockBatchers({
      paymentResponses: [{ status: 200, json: () => Promise.resolve(getMockSendPaymentResponse()) }],
      statusResponses: [{ status: 200, json: () => Promise.resolve(getPaymentStatusSuccess({ reference: 'trans-1' })) }]
    })
    const boom = new Error('boom')
    salesApi.processRPResult.mockImplementation(transId => (transId === 'trans-1' ? Promise.reject(boom) : Promise.resolve()))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await execute()

    expect(errorSpy).toHaveBeenCalledWith('Failed to process Recurring Payment for trans-1', boom)

    errorSpy.mockRestore()
  })

  describe('handling failures for multiple due payments', () => {
    beforeEach(() => {
      salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment(), getMockDueRecurringPayment()])
      salesApi.preparePermissionDataForRenewal.mockResolvedValueOnce({ licensee: { countryCode: 'GB-ENG' } })
      salesApi.createTransaction.mockResolvedValueOnce({ id: 'trans-1', cost: 30 }).mockResolvedValueOnce({ id: 'trans-2', cost: 30 })
    })

    it('continues when processRPResult rejects for one payment', async () => {
      const firstPayment = getMockSendPaymentResponse({
        payment_id: 'pay-1',
        agreementId: 'agr-1',
        created_date: '2025-01-01T00:00:00.000Z'
      })
      const secondPayment = getMockSendPaymentResponse({
        payment_id: 'pay-2',
        agreementId: 'agr-2',
        created_date: '2025-01-01T00:01:00.000Z'
      })
      const firstStatus = getPaymentStatusSuccess({
        payment_id: firstPayment.payment_id,
        created_date: firstPayment.created_date,
        reference: 'trans-1'
      })
      const secondStatus = getPaymentStatusSuccess({
        payment_id: secondPayment.payment_id,
        created_date: secondPayment.created_date,
        reference: 'trans-2'
      })
      mockBatchers({
        paymentResponses: [
          { status: 200, json: () => Promise.resolve(firstPayment) },
          { status: 200, json: () => Promise.resolve(secondPayment) }
        ],
        statusResponses: [
          { status: 200, json: () => Promise.resolve(firstStatus) },
          { status: 200, json: () => Promise.resolve(secondStatus) }
        ]
      })
      const boom = new Error('boom')
      salesApi.processRPResult.mockRejectedValueOnce(boom)
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await execute()

      const summary = {
        rpResultArgs: salesApi.processRPResult.mock.calls,
        rpCount: salesApi.processRPResult.mock.calls.length,
        firstError: errorSpy.mock.calls[0]
      }

      errorSpy.mockRestore()

      expect(summary).toEqual({
        rpResultArgs: expect.arrayContaining([
          ['trans-1', firstPayment.payment_id, firstPayment.created_date],
          ['trans-2', secondPayment.payment_id, secondPayment.created_date]
        ]),
        rpCount: 2,
        firstError: ['Failed to process Recurring Payment for trans-1', boom]
      })
    })

    it('does not abort when getPaymentStatus rejects for one payment (allSettled at status stage)', async () => {
      const firstPayment = getMockSendPaymentResponse({ payment_id: 'pay-1', created_date: '2025-01-01T00:00:00.000Z' })
      const secondPayment = getMockSendPaymentResponse({ payment_id: 'pay-2', created_date: '2025-01-01T00:01:00.000Z' })

      mockBatchers({
        paymentResponses: [
          { status: 200, json: () => Promise.resolve(firstPayment) },
          { status: 200, json: () => Promise.resolve(secondPayment) }
        ],
        statusResponses: [
          new Error('Payment status fetch failed'),
          {
            status: 200,
            json: () =>
              Promise.resolve(
                getPaymentStatusSuccess({
                  payment_id: secondPayment.payment_id,
                  created_date: secondPayment.created_date,
                  reference: 'trans-2'
                })
              )
          }
        ]
      })

      await execute()

      const summary = {
        statusArgs: queueRecurringPaymentStatusCheck.mock.calls.map(c => c[0]),
        statusCount: queueRecurringPaymentStatusCheck.mock.calls.length,
        rpResultArgs: salesApi.processRPResult.mock.calls,
        rpCount: salesApi.processRPResult.mock.calls.length
      }

      expect(summary).toEqual({
        statusArgs: expect.arrayContaining([firstPayment.payment_id, secondPayment.payment_id]),
        statusCount: 2,
        rpResultArgs: expect.arrayContaining([['trans-2', secondPayment.payment_id, secondPayment.created_date]]),
        rpCount: 1
      })
    })
  })

  it.each([
    [400, 'Failed to fetch status for payment test-payment-id, error 400'],
    [486, 'Failed to fetch status for payment test-payment-id, error 486'],
    [499, 'Failed to fetch status for payment test-payment-id, error 499'],
    [500, 'Payment status API error for test-payment-id, error 500'],
    [512, 'Payment status API error for test-payment-id, error 512'],
    [599, 'Payment status API error for test-payment-id, error 599']
  ])('logs the correct message when queued payment status request rejects with HTTP %i', async (status, expectedMessage) => {
    jest.spyOn(console, 'error')
    const mockPaymentId = 'test-payment-id'
    const mockResponse = [getMockDueRecurringPayment({ agreementId: 'agreement-1' })]
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(mockResponse)
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockPaymentId })
    mockBatchers({
      paymentResponses: [
        {
          status: 200,
          json: () => Promise.resolve({ payment_id: mockPaymentId, agreement_id: mockResponse[0].entity.agreementId })
        }
      ],
      statusResponses: [{ status }]
    })

    await execute()

    expect(console.error).toHaveBeenCalledWith(expectedMessage)
  })

  it('logs the generic unexpected-error message and still rejects', async () => {
    jest.spyOn(console, 'error')
    const mockPaymentId = 'test-payment-id'
    const duePayments = [getMockDueRecurringPayment()]
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(duePayments)
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockPaymentId })
    const networkError = new Error('network meltdown')
    mockBatchers({
      paymentResponses: [
        {
          status: 200,
          json: () => Promise.resolve({ payment_id: mockPaymentId, agreement_id: duePayments[0].entity.agreementId })
        }
      ],
      statusResponses: [networkError]
    })

    await execute()

    expect(console.error).toHaveBeenCalledWith(`Unexpected error fetching payment status for ${mockPaymentId}.`)
  })

  it('should call setTimeout with correct delay when there are recurring payments', async () => {
    const referenceNumber = Symbol('reference')
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment({ referenceNumber })])
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())
    mockBatchers({
      paymentResponses: [
        {
          status: 200,
          json: () => Promise.resolve({ payment_id: 'test-payment-id', agreement_id: 'test-agreement-id' })
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: () => Promise.resolve(getPaymentStatusSuccess())
        }
      ]
    })

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
    const mockTransactionId = 'test-transaction-id'
    const mockPaymentId = 'test-payment-id'
    const mockPaymentCreatedDate = '2025-01-01T00:00:00.000Z'
    const mockPaymentRequestResponse = [getMockDueRecurringPayment()]
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(mockPaymentRequestResponse)
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockTransactionId, cost: 30 })

    mockBatchers({
      paymentResponses: [
        {
          status: 200,
          json: () =>
            Promise.resolve({
              payment_id: mockPaymentId,
              created_date: mockPaymentCreatedDate,
              agreement_id: mockPaymentRequestResponse[0].entity.agreementId
            })
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: () =>
            Promise.resolve(
              getPaymentStatusSuccess({
                reference: mockTransactionId,
                payment_id: mockPaymentId,
                created_date: mockPaymentCreatedDate
              })
            )
        }
      ]
    })

    await execute()

    expect(salesApi.processRPResult).toHaveBeenCalledWith(mockTransactionId, mockPaymentId, mockPaymentCreatedDate)
  })

  it("doesn't call processRPResult if payment status is not successful", async () => {
    const mockPaymentId = 'test-payment-id'
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockPaymentId, cost: 30 })

    await execute()

    expect(salesApi.processRPResult).not.toHaveBeenCalled()
  })

  it.each`
    agreementId               | paymentDescription | mockStatus
    ${'agreement-id'}         | ${'failure'}       | ${getPaymentStatusFailure()}
    ${'test-agreement-id'}    | ${'failure'}       | ${getPaymentStatusFailure()}
    ${'another-agreement-id'} | ${'failure'}       | ${getPaymentStatusFailure()}
    ${'agreement-id'}         | ${'error'}         | ${getPaymentStatusError()}
    ${'test-agreement-id'}    | ${'error'}         | ${getPaymentStatusError()}
    ${'another-agreement-id'} | ${'error'}         | ${getPaymentStatusError()}
  `(
    'console error displays "Payment failed. Recurring payment agreement for: $agreementId set to be cancelled" when payment is a $paymentDescription',
    async ({ agreementId, mockStatus }) => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId })])
      const mockPaymentResponse = { payment_id: 'test-payment-id', agreement_id: agreementId, created_date: '2025-01-01T00:00:00.000Z' }
      mockBatchers({
        paymentResponses: [
          {
            status: 200,
            json: () => Promise.resolve(mockPaymentResponse)
          }
        ],
        statusResponses: [
          {
            status: 200,
            json: () => Promise.resolve(mockStatus)
          }
        ]
      })

      await execute()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Payment failed. Recurring payment agreement for: ${agreementId} set to be cancelled. Updating payment journal.`
      )
    }
  )

  it.each([
    ['a failure', 'agreement-id', getPaymentStatusFailure()],
    ['a failure', 'test-agreement-id', getPaymentStatusFailure()],
    ['a failure', 'another-agreement-id', getPaymentStatusFailure()],
    ['an error', 'agreement-id', getPaymentStatusError()],
    ['an error', 'test-agreement-id', getPaymentStatusError()],
    ['an error', 'another-agreement-id', getPaymentStatusError()]
  ])('cancelRecurringPayment is called when payment is %s', async (_status, agreementId, mockStatus) => {
    const id = Symbol('recurring-payment-id')
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId, id })])
    salesApi.createTransaction.mockReturnValueOnce({
      id: 'test-transaction-id',
      cost: 30,
      agreement_id: agreementId,
      recurringPayment: {
        id: ''
      }
    })
    const mockPaymentResponse = getMockSendPaymentResponse({
      payment_id: 'test-payment-id',
      agreement_id: agreementId,
      created_date: '2025-01-01T00:00:00.000Z'
    })
    mockBatchers({
      paymentResponses: [
        {
          status: 200,
          json: () => Promise.resolve(mockPaymentResponse)
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: () => Promise.resolve(mockStatus)
        }
      ]
    })

    await execute()

    expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith(id)
  })

  it('updatePaymentJournal is called with transaction id and failed status code payment is not succesful and payment journal exists', async () => {
    const dueRecurringPayment = getMockDueRecurringPayment()
    salesApi.getDueRecurringPayments.mockReturnValueOnce([dueRecurringPayment])
    const transactionId = 'test-transaction-id'
    salesApi.createTransaction.mockReturnValueOnce({
      cost: 50,
      id: transactionId
    })
    const mockPaymentResponse = {
      agreement_id: dueRecurringPayment.entity.agreementId,
      payment_id: 'test-payment-id',
      created_date: '2025-01-01T00:00:00.000Z',
      reference: transactionId
    }
    mockBatchers({
      paymentResponses: [
        {
          status: 200,
          json: () => Promise.resolve(mockPaymentResponse)
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: () => Promise.resolve(getPaymentStatusFailure())
        }
      ]
    })
    salesApi.getPaymentJournal.mockResolvedValueOnce(true)

    await execute()

    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith(transactionId, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
  })

  it('updatePaymentJournal is not called when failed status code payment is not succesful but payment journal does not exist', async () => {
    const dueRecurringPayment = getMockDueRecurringPayment()
    salesApi.getDueRecurringPayments.mockReturnValueOnce([dueRecurringPayment])
    const transactionId = 'test-transaction-id'
    salesApi.createTransaction.mockReturnValueOnce({
      cost: 50,
      id: transactionId
    })
    const mockPaymentResponse = {
      agreement_id: dueRecurringPayment.entity.agreementId,
      payment_id: 'test-payment-id',
      created_date: '2025-01-01T00:00:00.000Z',
      reference: transactionId
    }
    mockBatchers({
      paymentResponses: [
        {
          status: 200,
          json: () => Promise.resolve(mockPaymentResponse)
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: () => Promise.resolve(getPaymentStatusFailure())
        }
      ]
    })
    salesApi.getPaymentJournal.mockResolvedValueOnce(undefined)

    await execute()

    expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
  })

  it('all transactions are created before any payment requests are sent', async () => {
    const callLog = []
    const ids = ['a1-b2', 'b1-c2', 'c1-d2', 'd1-e2']
    const dueRecurringPayments = []
    for (const id of ids) {
      salesApi.createTransaction.mockImplementationOnce(() => {
        callLog.push('createTransaction')
        return {
          id: 'test-transaction-id',
          cost: 30,
          recurringPayment: {
            id: 'recurring-payment-1'
          }
        }
      })
      queueRecurringPayment.mockImplementationOnce(() => {
        callLog.push('queueRecurringPayment')
      })
      dueRecurringPayments.push(getMockDueRecurringPayment({ id }))
    }
    salesApi.getDueRecurringPayments.mockReturnValueOnce(dueRecurringPayments)

    await execute()

    expect(callLog).toEqual([
      'createTransaction',
      'createTransaction',
      'createTransaction',
      'createTransaction',
      'queueRecurringPayment',
      'queueRecurringPayment',
      'queueRecurringPayment',
      'queueRecurringPayment'
    ])
  })

  // it('payment requests are only made when create transaction request succeeded', async () => {})

  describe.each([2, 3, 10])('if there are %d recurring payments', count => {
    it('prepares the data for each one', async () => {
      const references = []
      for (let i = 0; i < count; i++) {
        references.push(Symbol('reference' + i))
      }
      const mockGetDueRecurringPayments = []
      references.forEach(referenceNumber => {
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment({ referenceNumber }))
      })
      salesApi.getDueRecurringPayments.mockReturnValueOnce(mockGetDueRecurringPayments)
      const expectedData = []
      references.forEach(reference => {
        expectedData.push([reference])
      })

      await execute()

      expect(salesApi.preparePermissionDataForRenewal.mock.calls).toEqual(expectedData)
    })

    it('creates a transaction for each one', async () => {
      const mockGetDueRecurringPayments = []
      const agreementIds = []
      const ids = []
      for (let i = 0; i < count; i++) {
        const agreementId = Symbol(`agreement-id-${i}`)
        const id = Symbol(`recurring-payment-${i}`)
        agreementIds.push(agreementId)
        ids.push(id)
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment({ agreementId, id, referenceNumber: i }))
      }
      salesApi.getDueRecurringPayments.mockReturnValueOnce(mockGetDueRecurringPayments)

      const permits = []
      for (let i = 0; i < count; i++) {
        permits.push(Symbol(`permit${i}`))
      }

      permits.forEach(permit => {
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
          licensee: { countryCode: 'GB-ENG' },
          permitId: permit
        })
      })

      const expectedData = []
      permits.forEach((permit, i) => {
        expectedData.push([
          {
            dataSource: 'Recurring Payment',
            recurringPayment: {
              agreementId: agreementIds[i],
              id: ids[i]
            },
            permissions: [expect.objectContaining({ permitId: permit })]
          }
        ])
      })

      await execute()

      expect(salesApi.createTransaction.mock.calls).toEqual(expectedData)
    })

    it('sends a payment for each one', async () => {
      const mockGetDueRecurringPayments = []
      const agreementIds = []
      const permits = []
      const expectedData = []
      for (let i = 0; i < count; i++) {
        const agreementId = `f2532882-3560-400d-8583-0e6f87e15ea${i}`
        const permit = Symbol(`permit${i}`)
        agreementIds.push(agreementId)
        permits.push(permit)
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment({ agreementId }))
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
          licensee: { countryCode: 'GB-ENG' }
        })
        salesApi.createTransaction.mockReturnValueOnce({
          cost: i,
          id: permit
        })
        expectedData.push({
          amount: i * 100,
          description: 'The recurring card payment for your rod fishing licence',
          reference: permit,
          authorisation_mode: 'agreement',
          agreement_id: agreementId
        })
      }
      salesApi.getDueRecurringPayments.mockReturnValueOnce(mockGetDueRecurringPayments)

      await execute()
      expectedData.forEach(expectedCall => {
        expect(queueRecurringPayment).toHaveBeenCalledWith(expectedCall, expect.any(HTTPRequestBatcher))
      })
    })

    it('gets the payment status for each one', async () => {
      const mockGetDueRecurringPayments = []
      const agreementIds = []
      const permits = []
      const govUkPayResponses = []
      const expectedData = []
      for (let i = 0; i < count; i++) {
        const agreementId = `f2532882-3560-400d-8583-0e6f87e15ea${i}`
        const permit = Symbol(`permit${i}`)
        const paymentId = `payment-id-${i}`
        const mockPaymentResponse = { payment_id: paymentId, agreement_id: agreementId }
        agreementIds.push(agreementId)
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment({ agreementId }))
        permits.push(permit)
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
          licensee: { countryCode: 'GB-ENG' }
        })
        salesApi.createTransaction.mockReturnValueOnce({
          cost: i,
          id: permit
        })
        expectedData.push(paymentId)
        govUkPayResponses.push({
          status: 200,
          json: () => Promise.resolve(mockPaymentResponse)
        })
      }
      HTTPRequestBatcher.mockImplementationOnce(getBatcherImplementation(govUkPayResponses))
      salesApi.getDueRecurringPayments.mockReturnValueOnce(mockGetDueRecurringPayments)

      await execute()

      expectedData.forEach(paymentId => {
        expect(queueRecurringPaymentStatusCheck).toHaveBeenCalledWith(paymentId, expect.any(HTTPRequestBatcher))
      })
    })
  })
})
