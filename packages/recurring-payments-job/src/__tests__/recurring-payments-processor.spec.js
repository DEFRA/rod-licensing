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
    this.responseDetails = [
      {
        url: 'url',
        options: {},
        reference: 'test-agreement-id',
        responses: [{ status: 200, json: () => Promise.resolve(getMockSendPaymentResponse()) }]
      }
    ]
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
      this.responseDetails = responses.map(response => {
        return {
          url: 'url',
          options: {},
          reference: response.reference || 'test-agreement-id',
          responses: Array.isArray(response) ? response : [response]
        }
      })
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

const getJSONImplementation = responseJSON => {
  return function () {
    if (!this.called) {
      this.called = true
      return Promise.resolve(responseJSON)
    }
    return Promise.reject(new TypeError('body used already'))
  }
}

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
    it('lack of a json function on the error response is handled gracefully', async () => {
      jest.spyOn(console, 'error')
      const mockPayment = getMockDueRecurringPayment()
      salesApi.getDueRecurringPayments.mockReturnValueOnce([mockPayment])
      const errorResponse = new Error('Network error')
      errorResponse.reference = mockPayment.agreementId
      mockBatchers({ paymentResponses: [errorResponse] })

      await execute()

      expect(console.error).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/response\.json is not a function.*/)
        })
      )
    })

    it.each(['cd068c00-638f-49d9-baa8-fc7aa3022698', '003d1230-3746-47a8-9778-0c4cfb7438f4'])(
      'logs an error for the failed payment request including agreement id %s',
      async agreementId => {
        jest.spyOn(console, 'error')
        salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ referenceNumber: 'fee', agreementId })])
        const errorResponse = new Error('Server down')
        errorResponse.reference = agreementId
        mockBatchers({
          paymentResponses: [errorResponse]
        })

        await execute()

        expect(console.error).toHaveBeenCalledWith(`Error when calling GOV.UK Pay API for agreement ${agreementId}:`, errorResponse)
      }
    )

    it('subsequent payment requests are still sent', async () => {
      const agreementIds = [
        '45f0ac55-9638-426f-b8f6-154cd8eda5fc',
        '086f1185-acae-4b7a-a362-3eca973c36f9',
        '094ad13c-4d77-4ed1-98e9-47844f998571',
        '208a3f88-7753-45d6-a642-172db734cd73'
      ]
      salesApi.getDueRecurringPayments.mockReturnValueOnce([
        getMockDueRecurringPayment({ agreementId: agreementIds[0] }),
        getMockDueRecurringPayment({ agreementId: agreementIds[1] }),
        getMockDueRecurringPayment({ agreementId: agreementIds[2] }),
        getMockDueRecurringPayment({ agreementId: agreementIds[3] })
      ])
      for (let x = 0; x < agreementIds.length; x++) {
        salesApi.createTransaction.mockReturnValueOnce({
          cost: 50,
          id: `transaction-id-${x + 1}`
        })
      }
      const expectedData = {
        amount: 5000,
        description: 'The recurring card payment for your rod fishing licence',
        reference: 'transactionId',
        authorisation_mode: 'agreement'
      }

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

    it('logs an error for data preparation and create transaction failures', async () => {
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
          { status: 200, json: getJSONImplementation({ payment_id: 'payment-id-1', agreement_id: 'agreement-id-1', description: '' }) },
          { status: 200, json: getJSONImplementation({ payment_id: 'payment-id-2', agreement_id: 'agreement-id-2', description: '' }) }
        ])
      )
      // no need to mock returns for payment status batcher as we are only testing transaction creation errors here

      await execute()

      expect(console.error).toHaveBeenCalledWith(expect.any(String), ...errors)
    })

    it('logs an error when a payment fails', async () => {
      jest.spyOn(console, 'error')
      salesApi.getDueRecurringPayments.mockReturnValueOnce([
        getMockDueRecurringPayment({ referenceNumber: 'fee', agreementId: 'a1' }),
        getMockDueRecurringPayment({ referenceNumber: 'fi', agreementId: 'a2' }),
        getMockDueRecurringPayment({ referenceNumber: 'foe', agreementId: 'a3' }),
        getMockDueRecurringPayment({ referenceNumber: 'fum', agreementId: 'a4' })
      ])
      const errorResponse = new Error('Payment request failed')
      errorResponse.reference = 'a2'
      mockBatchers({
        paymentResponses: [
          { status: 200, reference: 'a1', json: getJSONImplementation(getMockSendPaymentResponse({ agreement_id: 'a1' })) },
          { status: 500, reference: 'a2', json: getJSONImplementation({ code: 'B00M', description: 'Something dreadful happened' }) },
          { status: 200, reference: 'a3', json: getJSONImplementation(getMockSendPaymentResponse({ agreement_id: 'a3' })) },
          { status: 200, reference: 'a4', json: getJSONImplementation(getMockSendPaymentResponse({ agreement_id: 'a4' })) }
        ],
        statusResponses: [
          { status: 200, json: getJSONImplementation(getPaymentStatusSuccess()) },
          { status: 200, json: getJSONImplementation(getPaymentStatusSuccess()) },
          { status: 200, json: getJSONImplementation(getPaymentStatusSuccess()) }
        ]
      })

      await execute()

      expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/Unexpected response from GOV.UK Pay API\..*/))
    })

    describe.each(['must be active', 'does not exist'])('when the error is caused by an invalid agreementId', errorMessageFragment => {
      it(`logs out the ids when agreement ${errorMessageFragment}`, async () => {
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
              reference: agreementId,
              json: getJSONImplementation({
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

      it(`cancels the recurring payment ${errorMessageFragment}`, async () => {
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
              reference: agreementId,
              json: getJSONImplementation({
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
            json: getJSONImplementation({ code: 'B00M', description: 'The moon blew up without warning and for no apparent reason' })
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
        { status: 200, paymentId: 'aab5a964-7b4b-42f9-b9a9-bf97e9789739' },
        { status: 200, paymentId: '903edb3d-85e5-40b2-9027-12b7b91329c9' },
        new Error('Payment request failed'),
        { status: 200, paymentId: 'a7bffcac-c4c5-463a-ad23-d6ed6b2c96f7' },
        new Error('Payment request failed'),
        { status: 200, paymentId: '821d2705-7eb5-4e43-9d71-9ae899981cf3' }
      ]
    ],
    [
      3,
      '429 and 500 responses',
      [
        { status: 200, paymentId: '92972d0a-5f88-4ea6-b594-3f9ad84a99c3' },
        { status: 429 },
        { status: 500 },
        { status: 200, paymentId: '524485f9-8fc4-4cba-8b9e-39d111b66014' },
        { status: 201, paymentId: 'a8f79b64-e5cb-4ad9-b31e-fca64d0dd709' }
      ]
    ]
  ])(
    'processRecurringPayments requests payment status for all %i successful payments when responses include %s',
    (expectedStatusCallCount, _d, sampleResponses) => {
      it('queues a payment status check for each successful payment response', async () => {
        const responses = sampleResponses.map((sr, idx) => ({ ...sr, reference: `a-${idx}` }))
        const paymentIds = responses.filter(r => r.paymentId).map(r => r.paymentId)
        for (let x = 0; x < responses.length; x++) {
          if (responses[x].paymentId) {
            responses[x].json = getJSONImplementation(
              getMockSendPaymentResponse({ payment_id: responses[x].paymentId, agreement_id: `a-${x}` })
            )
          }
        }
        const dueRecurringPayments = Array(responses.length)
        for (let i = 0; i < dueRecurringPayments.length; i++) {
          dueRecurringPayments[i] = getMockDueRecurringPayment({ agreementId: `a-${i}` })
        }
        salesApi.getDueRecurringPayments.mockReturnValueOnce(dueRecurringPayments)
        HTTPRequestBatcher.mockImplementationOnce(getBatcherImplementation(responses))

        await execute()

        const paymentStatusBatcher = HTTPRequestBatcher.mock.instances[1]
        paymentIds.forEach((paymentId, idx) => {
          expect(queueRecurringPaymentStatusCheck).toHaveBeenNthCalledWith(idx + 1, paymentId, paymentStatusBatcher)
        })
      })

      it('initiates the batcher to retrieve payment statuses', async () => {
        const responses = sampleResponses.map((sr, idx) => ({ ...sr, reference: `a-${idx}` }))
        for (let x = 0; x < responses.length; x++) {
          if (responses[x].paymentId) {
            responses[x].json = getJSONImplementation(
              getMockSendPaymentResponse({ payment_id: responses[x].paymentId, agreement_id: `a-${x}` })
            )
          }
        }
        const dueRecurringPayments = Array(responses.length)
        for (let i = 0; i < dueRecurringPayments.length; i++) {
          dueRecurringPayments[i] = getMockDueRecurringPayment({ agreementId: `a-${i}` })
        }
        salesApi.getDueRecurringPayments.mockReturnValueOnce(dueRecurringPayments)
        HTTPRequestBatcher.mockImplementationOnce(getBatcherImplementation(responses))

        await execute()
        const paymentStatusBatcher = HTTPRequestBatcher.mock.instances[1]
        expect(paymentStatusBatcher.fetch).toHaveBeenCalled()
      })
    }
  )

  it('prepares the data for found recurring payments', async () => {
    const referenceNumber = 'aefcd534-d2f8-422a-b959-70ee6bc1ead2'
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ referenceNumber })])

    await execute()

    expect(salesApi.preparePermissionDataForRenewal).toHaveBeenCalledWith(referenceNumber)
  })

  it('creates a transaction with the correct data', async () => {
    const id = 'f7a3e603-1206-4ed3-afc3-80342075f5fc'
    const agreementId = '77c2c30c-b7b3-42eb-8919-ce9b157b7c9c'
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId, id })])

    const isLicenceForYou = 'f824e9b2-d2ee-449b-9c06-2bd9e60a797b'
    const isRenewal = 'c5d5e46b-3a98-4512-b6ec-435b32f011c2'
    const country = 'ee6c7fc5-dd90-49f7-8b87-a301fb4abc45'
    const permitId = 'b4fe7675-29d4-4372-aa3a-7b09c59381b6'
    const firstName = 'cd775e3c-6215-423e-9582-73e4aac02177'
    const lastName = '9b3ae360-0388-46ed-90d2-a51d540ea7e8'

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

  it('only creates payments for transactions that are successfully created', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment(), getMockDueRecurringPayment()])
    salesApi.createTransaction.mockRejectedValueOnce(new Error('Transaction creation failed'))

    await execute()

    expect(queueRecurringPayment).toHaveBeenCalledTimes(1)
  })

  it('creates a payment journal entry', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    const samplePayment = {
      payment_id: '29144939-421d-4717-b085-9c06abf08845',
      created_date: 'eef03cd5-ef79-4319-8fa7-250cd7d8d54f'
    }
    const sampleTransaction = {
      id: '53e15493-9e69-401d-b53e-09e8cde3edb3',
      cost: 99
    }
    HTTPRequestBatcher.mockImplementationOnce(
      getBatcherImplementation([
        {
          status: 200,
          reference: 'test-agreement-id',
          json: getJSONImplementation(
            getMockSendPaymentResponse(
              getPaymentStatusSuccess({
                payment_id: samplePayment.payment_id,
                created_date: samplePayment.created_date,
                reference: sampleTransaction.id,
                agreement_id: 'test-agreement-id'
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
    const paymentIds = [
      '561ba547-9d22-45e5-a879-ce1c4656be37',
      '51006b9f-f974-467a-a6c0-fad176b4e507',
      '522bca2a-441d-43ef-9313-cef4916f41f0',
      'cc7bea1f-8180-4e0f-8aac-9a25fccffdd2',
      'b2bd701d-26fb-487a-bc43-c844cd648237'
    ]
    const responses = [
      { status: 200, reference: 'a-1', json: getJSONImplementation(getMockSendPaymentResponse({ payment_id: paymentIds[0] })) },
      Object.assign(new Error('Payment request failed'), { reference: 'a-2' }),
      { status: 201, reference: 'a-3', json: getJSONImplementation(getMockSendPaymentResponse({ payment_id: paymentIds[1] })) },
      Object.assign(new Error('Payment request failed'), { reference: 'a-4' }),
      { status: 210, reference: 'a-5', json: getJSONImplementation(getMockSendPaymentResponse({ payment_id: paymentIds[2] })) },
      { status: 222, reference: 'a-6', json: getJSONImplementation(getMockSendPaymentResponse({ payment_id: paymentIds[3] })) },
      { status: 429, reference: 'a-7', json: getJSONImplementation({ field: '', code: 'P0900', description: 'Calm it down a bit' }) },
      { status: 500, reference: 'a-8', json: getJSONImplementation({ description: 'BOOM!' }) },
      { status: 299, reference: 'a-9', json: getJSONImplementation(getMockSendPaymentResponse({ payment_id: paymentIds[4] })) }
    ]
    const dueRecurringPayments = Array(responses.length)
    for (let i = 0; i < dueRecurringPayments.length; i++) {
      dueRecurringPayments[i] = getMockDueRecurringPayment({ agreementId: `a-${i + 1}` })
    }
    salesApi.getDueRecurringPayments.mockReturnValueOnce(dueRecurringPayments)
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
      getBatcherImplementation([
        { json: getJSONImplementation({ payment_id: 'test-payment-id', agreement_id: duePayment.entity.agreementId }) }
      ])
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
      paymentResponses: [
        { status: 200, reference: 'agreement-1', json: getJSONImplementation({ payment_id: mockPaymentId, agreement_id: 'agreement-1' }) }
      ],
      statusResponses: [
        { status: 200, reference: 'agreement-1', json: getJSONImplementation(getPaymentStatusSuccess({ payment_id: mockPaymentId })) }
      ]
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

  it('calls batcher fetch if there is at least one due payment', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])

    await execute()

    expect(HTTPRequestBatcher.mock.instances[0].fetch).toHaveBeenCalled()
  })

  it('should log errors from salesApi.processRPResult', async () => {
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockResolvedValueOnce({ id: 'trans-1', cost: 30 })
    mockBatchers({
      paymentResponses: [{ status: 200, json: getJSONImplementation(getMockSendPaymentResponse()) }],
      statusResponses: [{ status: 200, json: getJSONImplementation(getPaymentStatusSuccess({ reference: 'trans-1' })) }]
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
      salesApi.getDueRecurringPayments.mockResolvedValueOnce([
        getMockDueRecurringPayment({ agreementId: 'agr-1' }),
        getMockDueRecurringPayment({ agreementId: 'agr-2' })
      ])
      salesApi.preparePermissionDataForRenewal.mockResolvedValueOnce({ licensee: { countryCode: 'GB-ENG' } })
      salesApi.createTransaction.mockResolvedValueOnce({ id: 'trans-1', cost: 30 }).mockResolvedValueOnce({ id: 'trans-2', cost: 30 })
    })

    it('continues when processRPResult rejects for one payment', async () => {
      const firstPayment = getMockSendPaymentResponse({
        payment_id: 'pay-1',
        agreement_id: 'agr-1',
        created_date: '2025-01-01T00:00:00.000Z'
      })
      const secondPayment = getMockSendPaymentResponse({
        payment_id: 'pay-2',
        agreement_id: 'agr-2',
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
          { status: 200, reference: 'agr-1', json: getJSONImplementation(firstPayment) },
          { status: 200, reference: 'agr-2', json: getJSONImplementation(secondPayment) }
        ],
        statusResponses: [
          { status: 200, json: getJSONImplementation(firstStatus) },
          { status: 200, json: getJSONImplementation(secondStatus) }
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

    it('does not abort when call to get payment status rejects for one payment', async () => {
      const firstPayment = getMockSendPaymentResponse({
        payment_id: 'pay-1',
        agreement_id: 'agr-1',
        created_date: '2025-01-01T00:00:00.000Z'
      })
      const secondPayment = getMockSendPaymentResponse({
        payment_id: 'pay-2',
        agreement_id: 'agr-2',
        created_date: '2025-01-01T00:01:00.000Z'
      })

      mockBatchers({
        paymentResponses: [
          { status: 200, reference: 'agr-1', json: getJSONImplementation(firstPayment) },
          { status: 200, reference: 'agr-2', json: getJSONImplementation(secondPayment) }
        ],
        statusResponses: [
          new Error('Payment status fetch failed'),
          {
            status: 200,
            json: getJSONImplementation(
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
          reference: 'agreement-1',
          json: getJSONImplementation({ payment_id: mockPaymentId, agreement_id: mockResponse[0].entity.agreementId })
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
          json: getJSONImplementation({ payment_id: mockPaymentId, agreement_id: duePayments[0].entity.agreementId })
        }
      ],
      statusResponses: [networkError]
    })

    await execute()

    expect(console.error).toHaveBeenCalledWith(`Unexpected error fetching payment status for ${mockPaymentId}.`)
  })

  it('should call setTimeout with correct delay when there are recurring payments', async () => {
    const referenceNumber = '243d0b59-ad08-408d-81df-37aff0aebab2'
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment({ referenceNumber })])
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())
    mockBatchers({
      paymentResponses: [
        {
          status: 200,
          json: getJSONImplementation({ payment_id: 'test-payment-id', agreement_id: 'test-agreement-id' })
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: getJSONImplementation(getPaymentStatusSuccess())
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
          json: getJSONImplementation({
            payment_id: mockPaymentId,
            created_date: mockPaymentCreatedDate,
            agreement_id: mockPaymentRequestResponse[0].entity.agreementId
          })
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: getJSONImplementation(
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

  it('only retrieves payment response json once', async () => {
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment()])
    const mockPaymentResponse = getMockSendPaymentResponse()
    const paymentResponseJSON = jest.fn(() => mockPaymentResponse)
    mockBatchers({
      paymentResponses: [{ status: 200, json: paymentResponseJSON }],
      statusResponses: [{ status: 200, json: getJSONImplementation(getPaymentStatusSuccess()) }]
    })

    await execute()

    expect(paymentResponseJSON).toHaveBeenCalledTimes(1)
  })

  it('only retrieves payment status response json once', async () => {
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment()])
    const mockPaymentStatusResponse = getPaymentStatusSuccess()
    const paymentStatusJSON = jest.fn(() => mockPaymentStatusResponse)
    mockBatchers({
      paymentResponses: [{ status: 200, json: getJSONImplementation(getMockSendPaymentResponse()) }],
      statusResponses: [{ status: 200, json: paymentStatusJSON }]
    })

    await execute()

    expect(paymentStatusJSON).toHaveBeenCalledTimes(1)
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
      const mockPaymentResponse = {
        payment_id: 'test-payment-id',
        agreement_id: agreementId,
        created_date: '2025-01-01T00:00:00.000Z',
        randomTag: Symbol('random')
      }
      mockBatchers({
        paymentResponses: [
          {
            status: 200,
            reference: agreementId,
            json: getJSONImplementation(mockPaymentResponse)
          }
        ],
        statusResponses: [
          {
            status: 200,
            json: getJSONImplementation(mockStatus)
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
    const id = '8c6392f2-4dc7-4fb9-b197-d116c0e6409d'
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
          reference: agreementId,
          json: getJSONImplementation(mockPaymentResponse)
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: getJSONImplementation(mockStatus)
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
          json: getJSONImplementation(mockPaymentResponse)
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: getJSONImplementation(getPaymentStatusFailure())
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
          json: getJSONImplementation(mockPaymentResponse)
        }
      ],
      statusResponses: [
        {
          status: 200,
          json: getJSONImplementation(getPaymentStatusFailure())
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
    const paymentResponses = []
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
      paymentResponses.push({
        status: 400,
        json: getJSONImplementation({ description: 'fail' })
      })
    }
    salesApi.getDueRecurringPayments.mockReturnValueOnce(dueRecurringPayments)
    HTTPRequestBatcher.mockImplementationOnce(getBatcherImplementation(paymentResponses))

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

  it('when a 429 response is received, the eventual success is tied to the correct payment', async () => {
    const paymentIdentifiers = { payment_id: 'test-payment-id', agreement_id: 'test-agreement-id' }
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockReturnValueOnce({
      cost: 50,
      id: 'test-transaction-id'
    })
    const paymentResponse = [{ status: 429 }, { status: 200, json: getJSONImplementation(paymentIdentifiers) }]
    paymentResponse.reference = 'test-agreement-id'
    mockBatchers({
      paymentResponses: [paymentResponse],
      statusResponses: [
        {
          status: 200,
          json: getJSONImplementation({
            ...getPaymentStatusSuccess(),
            ...paymentIdentifiers,
            reference: 'test-transaction-id',
            created_date: ''
          })
        }
      ]
    })
    salesApi.getPaymentJournal.mockResolvedValueOnce(true)

    await execute()

    expect(salesApi.processRPResult).toHaveBeenCalledWith('test-transaction-id', 'test-payment-id', expect.any(String))
  })

  it('matches payment responses to requested payments by agreementId rather than ordinal position', async () => {
    const agreementIds = ['de825dec-ed0d-435e-8543-776ae2799f9d', '91df9489-ee8e-41ca-8443-f5cc62967616']
    salesApi.getDueRecurringPayments.mockReturnValueOnce([
      getMockDueRecurringPayment({ agreementId: agreementIds[0] }),
      getMockDueRecurringPayment({ agreementId: agreementIds[1] })
    ])
    salesApi.createTransaction
      .mockReturnValueOnce({
        cost: 22,
        id: 'transaction-1'
      })
      .mockReturnValueOnce({
        cost: 44,
        id: 'transaction-2'
      })
    const paymentResponses = [
      { status: 200, reference: agreementIds[1], json: getJSONImplementation({ payment_id: 'payment-2', agreement_id: agreementIds[1] }) },
      { status: 200, reference: agreementIds[0], json: getJSONImplementation({ payment_id: 'payment-1', agreement_id: agreementIds[0] }) }
    ]
    mockBatchers({
      // payment responses are intentionally out of order to test matching by agreementId
      paymentResponses,
      statusResponses: [
        {
          status: 200,
          json: getJSONImplementation({
            ...getPaymentStatusSuccess(),
            payment_id: 'payment-1',
            agreement_id: agreementIds[0]
          })
        },
        {
          status: 200,
          json: getJSONImplementation({
            ...getPaymentStatusSuccess(),
            payment_id: 'payment-2',
            agreement_id: agreementIds[1]
          })
        }
      ]
    })

    await execute()

    expect(salesApi.createPaymentJournal).toHaveBeenNthCalledWith(
      1,
      'transaction-1',
      expect.objectContaining({ paymentReference: 'payment-1' })
    )
    expect(salesApi.createPaymentJournal).toHaveBeenNthCalledWith(
      2,
      'transaction-2',
      expect.objectContaining({ paymentReference: 'payment-2' })
    )
  })

  describe.each([2, 3, 10])('if there are %d recurring payments', count => {
    const mockBatcher = () => {
      HTTPRequestBatcher.mockImplementationOnce(
        getBatcherImplementation(Array(count).fill({ status: 400, json: getJSONImplementation({ description: 'Failure' }) }))
      )
    }

    it('prepares the data for each one', async () => {
      const references = []
      for (let i = 0; i < count; i++) {
        references.push(`298ea261-3d61-4f77-add1-91ea136405f${i}`)
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
      mockBatcher()

      await execute()

      expect(salesApi.preparePermissionDataForRenewal.mock.calls).toEqual(expectedData)
    })

    it('creates a transaction for each one', async () => {
      const mockGetDueRecurringPayments = []
      const agreementIds = []
      const ids = []
      const permits = []
      const expectedData = []
      for (let i = 0; i < count; i++) {
        const agreementId = `77126ef9-69a1-4412-93e5-6d4d5d011c7${i}`
        const id = `bf21de64-c4e1-48fc-a71e-ce959352943${i}`
        const permit = `ddcd80df-0569-4615-8d69-d47b02c0fd0${i}`
        agreementIds.push(agreementId)
        ids.push(id)
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment({ agreementId, id, referenceNumber: i }))
        permits.push(permit)
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
          licensee: { countryCode: 'GB-ENG' },
          permitId: permit
        })
        expectedData.push([
          {
            dataSource: 'Recurring Payment',
            recurringPayment: {
              agreementId: agreementId,
              id: id
            },
            permissions: [expect.objectContaining({ permitId: permit })]
          }
        ])
      }
      salesApi.getDueRecurringPayments.mockReturnValueOnce(mockGetDueRecurringPayments)
      mockBatcher()

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
        const permit = `bc6d2c2e-6c30-401d-b55d-69012b96f11${i}`
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
      mockBatcher()

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
        const permit = `bc9b0e08-16a5-4683-9217-9a19f396d31${i}`
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
          reference: agreementId,
          json: getJSONImplementation(mockPaymentResponse)
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
