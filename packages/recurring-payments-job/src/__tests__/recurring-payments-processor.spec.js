import { airbrake, salesApi } from '@defra-fish/connectors-lib'
import { PAYMENT_STATUS, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { execute } from '../recurring-payments-processor.js'
import { getPaymentStatus, isGovPayUp, sendPayment } from '../services/govuk-pay-service.js'
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
  }
}))

jest.mock('../services/govuk-pay-service.js', () => ({
  sendPayment: jest.fn(() => ({ payment_id: 'payment_id', created_date: '2025-07-18T09:00:00.000Z' })),
  getPaymentStatus: jest.fn(),
  isGovPayUp: jest.fn(() => true)
}))

jest.mock('debug', () => jest.fn(() => jest.fn()))

const PAYMENT_STATUS_DELAY = 60000
const getPaymentStatusSuccess = () => ({ state: { status: 'payment status success' } })
const getPaymentStatusFailure = () => ({ state: { status: 'payment status failure' } })
const getPaymentStatusError = () => ({ state: { status: 'payment status error' } })
const getMockPaymentRequestResponse = () => [
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

const getMockDueRecurringPayment = ({ agreementId = 'test-agreement-id', id = 'abc-123', referenceNumber = '123' } = {}) => ({
  entity: { id, agreementId },
  expanded: { activePermission: { entity: { referenceNumber } } }
})

// eslint-disable-next-line camelcase
const getMockSendPaymentResponse = ({ payment_id = 'pay-1', agreementId = 'agr-1', created_date = '2025-01-01T00:00:00.000Z' } = {}) => ({
  payment_id,
  agreementId,
  created_date
})

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

  describe('When payment request throws an error...', () => {
    it('console.error is called with error message', async () => {
      jest.spyOn(console, 'error')
      salesApi.getDueRecurringPayments.mockReturnValueOnce(getMockPaymentRequestResponse())
      const oopsie = new Error('payment gate down')
      sendPayment.mockRejectedValueOnce(oopsie)

      try {
        await execute()
      } catch {}

      expect(console.error).toHaveBeenCalledWith(expect.any(String), oopsie)
    })

    it('prepares and sends all payment requests, even if some fail', async () => {
      const agreementIds = [Symbol('agreementId1'), Symbol('agreementId2'), Symbol('agreementId3'), Symbol('agreementId4')]
      salesApi.getDueRecurringPayments.mockReturnValueOnce([
        getMockDueRecurringPayment({ referenceNumber: 'fee', agreementId: agreementIds[0] }),
        getMockDueRecurringPayment({ referenceNumber: 'fi', agreementId: agreementIds[1] }),
        getMockDueRecurringPayment({ referenceNumber: 'foe', agreementId: agreementIds[2] }),
        getMockDueRecurringPayment({ referenceNumber: 'fum', agreementId: agreementIds[3] })
      ])

      const permissionData = { licensee: { countryCode: 'GB-ENG' } }
      for (let x = 0; x < agreementIds.length; x++) {
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce(permissionData)
        salesApi.createTransaction.mockReturnValueOnce({
          cost: 50,
          id: `transaction-id-${x + 1}`
        })

        if (x === 1) {
          const err = new Error('Payment request failed')
          sendPayment.mockRejectedValueOnce(err)
        } else {
          sendPayment.mockResolvedValueOnce({ payment_id: `test-payment-id-${x + 1}`, agreementId: agreementIds[x] })
        }
        if (x < 3) {
          getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())
        }
      }
      const expectedData = {
        amount: 5000,
        description: 'The recurring card payment for your rod fishing licence',
        reference: 'transactionId',
        authorisation_mode: 'agreement'
      }

      await execute()

      expect(sendPayment).toHaveBeenCalledTimes(4)
      expect(sendPayment).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ ...expectedData, reference: 'transaction-id-1', agreement_id: agreementIds[0] })
      )
      expect(sendPayment).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ ...expectedData, reference: 'transaction-id-2', agreement_id: agreementIds[1] })
      )
      expect(sendPayment).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ ...expectedData, reference: 'transaction-id-3', agreement_id: agreementIds[2] })
      )
      expect(sendPayment).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({ ...expectedData, reference: 'transaction-id-4', agreement_id: agreementIds[3] })
      )
    })

    it('logs an error for every failure', async () => {
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
      salesApi.createTransaction.mockRejectedValueOnce(errors[1]).mockReturnValueOnce({ cost: 50, id: 'transaction-id-3' })
      sendPayment.mockRejectedValueOnce(errors[2])

      await execute()

      expect(console.error).toHaveBeenCalledWith(expect.any(String), ...errors)
    })

    describe('when the error is caused by an invalid agreementId', () => {
      it('logs out the ids as an error', async () => {
        jest.spyOn(console, 'error')
        salesApi.getDueRecurringPayments.mockReturnValueOnce(getMockPaymentRequestResponse())
        const oopsie = new Error('Invalid attribute value: agreement_id. Agreement does not exist')
        sendPayment.mockRejectedValueOnce(oopsie)

        try {
          await execute()
        } catch (e) {}

        expect(console.error).toHaveBeenCalledWith(
          'agreement-1 is an invalid agreementId. Recurring payment recurring-payment-1 will be cancelled'
        )
      })

      it('cancels the recurring payment', async () => {
        salesApi.getDueRecurringPayments.mockReturnValueOnce(getMockPaymentRequestResponse())
        const oopsie = new Error('Invalid attribute value: agreement_id. Agreement does not exist')
        sendPayment.mockRejectedValueOnce(oopsie)

        try {
          await execute()
        } catch (e) {}

        expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith('recurring-payment-1')
      })

      it('throws an error', async () => {
        jest.spyOn(console, 'error')
        salesApi.getDueRecurringPayments.mockReturnValueOnce(getMockPaymentRequestResponse())
        const oopsie = new Error('Invalid attribute value: agreement_id. Agreement does not exist')
        sendPayment.mockRejectedValueOnce(oopsie)

        try {
          await execute()
        } catch (e) {}

        expect(console.error).toHaveBeenCalledWith('Error requesting payments:', oopsie)
      })

      describe('when there are valid and invalid agreement_ids', () => {
        const setUpMultipleRecurringPayments = (error = new Error('Invalid attribute value: agreement_id. Agreement does not exist')) => {
          // Send three recurring payments to the GOV.UK Pay API
          salesApi.getDueRecurringPayments.mockReturnValueOnce([
            ...getMockPaymentRequestResponse(),
            ...getMockPaymentRequestResponse(),
            ...getMockPaymentRequestResponse()
          ])
          salesApi.createTransaction
            .mockReturnValueOnce({
              id: 'test-transaction-id',
              cost: 30,
              recurringPayment: {
                id: 'first-recurring-payment'
              }
            })
            .mockReturnValueOnce({
              id: 'test-transaction-id',
              cost: 30,
              recurringPayment: {
                id: 'second-recurring-payment'
              }
            })
            .mockReturnValueOnce({
              id: 'test-transaction-id',
              cost: 30,
              recurringPayment: {
                id: 'third-recurring-payment'
              }
            })

          // Throw errors for the first two
          sendPayment.mockRejectedValueOnce(error).mockRejectedValueOnce(error)
          // The third should succeed
          getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())
        }

        it('cancels the invalid recurring payments but not the valid ones', async () => {
          setUpMultipleRecurringPayments()

          try {
            await execute()
          } catch (e) {}

          expect(salesApi.cancelRecurringPayment.mock.calls).toEqual([['first-recurring-payment'], ['second-recurring-payment']])
        })

        it('throws an error for each invalid payment', async () => {
          jest.spyOn(console, 'error')

          const oopsie = new Error('Invalid attribute value: agreement_id. Agreement does not exist')
          setUpMultipleRecurringPayments()

          try {
            await execute()
          } catch (e) {}

          expect(console.error.mock.calls).toEqual([
            ['agreement-1 is an invalid agreementId. Recurring payment first-recurring-payment will be cancelled'],
            ['agreement-1 is an invalid agreementId. Recurring payment second-recurring-payment will be cancelled'],
            ['Error requesting payments:', oopsie, oopsie]
          ])
        })
      })
    })

    describe('when the error is caused by a reason other than invalid agreementId', () => {
      it('does not try to cancel the recurring payment', async () => {
        salesApi.getDueRecurringPayments.mockReturnValueOnce(getMockPaymentRequestResponse())
        const oopsie = new Error('The moon blew up without warning and for no apparent reason')
        sendPayment.mockRejectedValueOnce(oopsie)

        try {
          await execute()
        } catch (e) {
          expect(salesApi.cancelRecurringPayment).not.toHaveBeenCalledWith('recurring-payment-1')
        }
      })
    })
  })

  describe('When payment status request throws an error...', () => {
    it('processRecurringPayments requests payment status for all payments, even if some throw errors', async () => {
      const dueRecurringPayments = []
      for (let x = 0; x < 6; x++) {
        dueRecurringPayments.push(getMockDueRecurringPayment())
        if ([1, 3].includes(x)) {
          getPaymentStatus.mockRejectedValueOnce(new Error(`status failure ${x}`))
        } else {
          getPaymentStatus.mockReturnValueOnce(getPaymentStatusSuccess())
        }
      }
      salesApi.getDueRecurringPayments.mockReturnValueOnce(dueRecurringPayments)

      await execute()

      expect(getPaymentStatus).toHaveBeenCalledTimes(6)
    })
  })

  it('prepares the data for found recurring payments', async () => {
    const referenceNumber = Symbol('reference')
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ referenceNumber })])
    const mockPaymentResponse = { payment_id: 'test-payment-id', created_date: '2025-01-01T00:00:00.000Z' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

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

    const mockPaymentResponse = { payment_id: 'test-payment-id', agreementId: 'test-agreement-id' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

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
    sendPayment.mockResolvedValueOnce(samplePayment)
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

    const mockPaymentResponse = { payment_id: 'test-payment-id' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

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

    const mockPaymentResponse = { payment_id: 'test-payment-id' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

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

    const mockPaymentResponse = { payment_id: 'test-payment-id' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

    await execute()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [expect.objectContaining({ startDate: '2020-03-14T00:00:00.000Z' })]
      })
    )
  })

  it('prepares and sends the payment request', async () => {
    const agreementId = Symbol('agreementId')
    const transactionId = 'transactionId'

    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ referenceNumber: 'foo', agreementId: agreementId })])

    salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
      licensee: { countryCode: 'GB-ENG' }
    })

    salesApi.createTransaction.mockReturnValueOnce({
      cost: 50,
      id: transactionId
    })

    const mockPaymentResponse = { payment_id: 'test-payment-id', agreementId }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

    const expectedData = {
      amount: 5000,
      description: 'The recurring card payment for your rod fishing licence',
      reference: transactionId,
      authorisation_mode: 'agreement',
      agreement_id: agreementId
    }

    await execute()

    expect(sendPayment).toHaveBeenCalledWith(expectedData)
  })

  it('should call getPaymentStatus with payment id', async () => {
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
      id: 'payment-id-1'
    })
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())
    const mockPaymentResponse = { payment_id: 'test-payment-id', agreementId: 'agreement-1' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)

    await execute()

    expect(getPaymentStatus).toHaveBeenCalledWith('test-payment-id')
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
    const mockPaymentResponse = { payment_id: mockPaymentId, agreementId: 'agreement-1' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

    await execute()

    console.log(debugLogger.mock.calls)
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

  // --- //

  it('should log errors from await salesApi.processRPResult', async () => {
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment()])
    salesApi.createTransaction.mockResolvedValueOnce({ id: 'trans-1', cost: 30 })

    const payment = getMockSendPaymentResponse()
    sendPayment.mockResolvedValueOnce(payment)

    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

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

    it('continues when one sendPayment rejects (Promise.allSettled check)', async () => {
      const secondPayment = getMockSendPaymentResponse({
        payment_id: 'test-payment-second',
        agreementId: 'agr-2',
        created_date: '2025-01-01T00:00:00.000Z'
      })

      const gatewayDown = new Error('gateway down')
      sendPayment.mockRejectedValueOnce(gatewayDown).mockResolvedValueOnce(secondPayment)
      getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())
      salesApi.processRPResult.mockResolvedValueOnce()

      await execute()

      const summary = {
        statusArgs: getPaymentStatus.mock.calls,
        rpResultArgs: salesApi.processRPResult.mock.calls
      }

      expect(summary).toEqual({
        statusArgs: [[secondPayment.payment_id]],
        rpResultArgs: [['trans-2', secondPayment.payment_id, secondPayment.created_date]]
      })
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

      sendPayment.mockResolvedValueOnce(firstPayment).mockResolvedValueOnce(secondPayment)
      getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess()).mockResolvedValueOnce(getPaymentStatusSuccess())

      const boom = new Error('boom')
      salesApi.processRPResult.mockImplementation(transId => (transId === 'trans-1' ? Promise.reject(boom) : Promise.resolve()))

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
      const p1 = getMockSendPaymentResponse({ payment_id: 'pay-1', created_date: '2025-01-01T00:00:00.000Z' })
      const p2 = getMockSendPaymentResponse({ payment_id: 'pay-2', created_date: '2025-01-01T00:01:00.000Z' })

      sendPayment.mockResolvedValueOnce(p1).mockResolvedValueOnce(p2)

      getPaymentStatus.mockImplementation(async id => {
        if (id === p1.payment_id) {
          throw Object.assign(new Error('HTTP 500'), { response: { status: 500, data: 'boom' } })
        }
        return getPaymentStatusSuccess()
      })

      salesApi.processRPResult.mockResolvedValueOnce()

      await execute()

      const summary = {
        statusArgs: getPaymentStatus.mock.calls,
        statusCount: getPaymentStatus.mock.calls.length,
        rpResultArgs: salesApi.processRPResult.mock.calls,
        rpCount: salesApi.processRPResult.mock.calls.length
      }

      expect(summary).toEqual({
        statusArgs: expect.arrayContaining([[p1.payment_id], [p2.payment_id]]),
        statusCount: 2,
        rpResultArgs: expect.arrayContaining([['trans-2', p2.payment_id, p2.created_date]]),
        rpCount: 1
      })
    })
  })

  // --- //

  it.each([
    [400, 'Failed to fetch status for payment test-payment-id, error 400'],
    [486, 'Failed to fetch status for payment test-payment-id, error 486'],
    [499, 'Failed to fetch status for payment test-payment-id, error 499'],
    [500, 'Payment status API error for test-payment-id, error 500'],
    [512, 'Payment status API error for test-payment-id, error 512'],
    [599, 'Payment status API error for test-payment-id, error 599']
  ])('logs the correct message when getPaymentStatus rejects with HTTP %i', async (statusCode, expectedMessage) => {
    jest.spyOn(console, 'error')
    const mockPaymentId = 'test-payment-id'
    const mockResponse = [
      { entity: { agreementId: 'agreement-1' }, expanded: { activePermission: { entity: { referenceNumber: 'ref-1' } } } }
    ]
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(mockResponse)
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockPaymentId })
    sendPayment.mockResolvedValueOnce({
      payment_id: mockPaymentId,
      agreementId: 'agreement-1',
      created_date: '2025-04-30T12:00:00Z'
    })

    const apiError = { response: { status: statusCode, data: 'boom' } }
    getPaymentStatus.mockRejectedValueOnce(apiError)

    await execute()

    expect(console.error).toHaveBeenCalledWith(expectedMessage)
  })

  it('logs the generic unexpected-error message and still rejects', async () => {
    jest.spyOn(console, 'error')
    const mockPaymentId = 'test-payment-id'
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(getMockPaymentRequestResponse())
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockPaymentId })
    sendPayment.mockResolvedValueOnce({
      payment_id: mockPaymentId,
      agreementId: 'agreement-1',
      created_date: '2025-04-30T12:00:00.000Z'
    })

    const networkError = new Error('network meltdown')
    getPaymentStatus.mockRejectedValueOnce(networkError)

    await execute()

    expect(console.error).toHaveBeenCalledWith(`Unexpected error fetching payment status for ${mockPaymentId}.`)
  })

  it('should call setTimeout with correct delay when there are recurring payments', async () => {
    const referenceNumber = Symbol('reference')
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment({ referenceNumber })])
    const mockPaymentResponse = { payment_id: 'test-payment-id' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

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
    debugLogger.mockImplementation(function () {
      console.log(...arguments)
    })
    const mockTransactionId = 'test-transaction-id'
    const mockPaymentId = 'test-payment-id'
    const mockPaymentCreatedDate = '2025-01-01T00:00:00.000Z'
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(getMockPaymentRequestResponse())
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockTransactionId, cost: 30 })
    sendPayment.mockResolvedValueOnce({ payment_id: mockPaymentId, agreementId: 'agreement-1', created_date: mockPaymentCreatedDate })
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

    await execute()

    console.log(salesApi.processRPResult.mock.calls, mockTransactionId, mockPaymentId, mockPaymentCreatedDate)
    expect(salesApi.processRPResult).toHaveBeenCalledWith(mockTransactionId, mockPaymentId, mockPaymentCreatedDate)
  })

  it("doesn't call processRPResult if payment status is not successful", async () => {
    const mockPaymentId = 'test-payment-id'
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(getMockPaymentRequestResponse())
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockPaymentId, cost: 30 })
    sendPayment.mockResolvedValueOnce({ payment_id: mockPaymentId, agreementId: 'agreement-1' })
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusFailure())

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
      const mockPaymentResponse = { payment_id: 'test-payment-id', created_date: '2025-01-01T00:00:00.000Z' }
      sendPayment.mockResolvedValueOnce(mockPaymentResponse)
      getPaymentStatus.mockResolvedValueOnce(mockStatus)

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
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment({ agreementId })])
    const id = Symbol('recurring-payment-id')
    salesApi.createTransaction.mockResolvedValueOnce({
      recurringPayment: {
        id
      }
    })
    const mockPaymentResponse = { payment_id: 'test-payment-id', created_date: '2025-01-01T00:00:00.000Z' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(mockStatus)

    await execute()

    expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith(id)
  })

  it('updatePaymentJournal is called with transaction id and failed status code payment is not succesful and payment journal exists', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    const transactionId = 'test-transaction-id'
    salesApi.createTransaction.mockReturnValueOnce({
      cost: 50,
      id: transactionId
    })
    const mockPaymentResponse = { payment_id: 'test-payment-id', created_date: '2025-01-01T00:00:00.000Z' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusFailure())
    salesApi.getPaymentJournal.mockResolvedValueOnce(true)

    await execute()

    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith(transactionId, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
  })

  it('updatePaymentJournal is not called when failed status code payment is not succesful but payment journal does not exist', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    const transactionId = 'test-transaction-id'
    salesApi.createTransaction.mockReturnValueOnce({
      cost: 50,
      id: transactionId
    })
    const mockPaymentResponse = { payment_id: 'test-payment-id', created_date: '2025-01-01T00:00:00.000Z' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusFailure())
    salesApi.getPaymentJournal.mockResolvedValueOnce(undefined)

    await execute()

    expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
  })

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
      const mockPaymentResponse = { payment_id: 'test-payment-id' }
      sendPayment.mockResolvedValue(mockPaymentResponse)
      const mockPaymentStatus = getPaymentStatusSuccess()
      getPaymentStatus.mockResolvedValue(mockPaymentStatus)

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
      for (let i = 0; i < count; i++) {
        const agreementId = Symbol(`agreementId${1}`)
        agreementIds.push(agreementId)
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment({ agreementId }))
      }
      salesApi.getDueRecurringPayments.mockReturnValueOnce(mockGetDueRecurringPayments)

      const permits = []
      for (let i = 0; i < count; i++) {
        permits.push(Symbol(`permit${i}`))
      }

      permits.forEach((permit, i) => {
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
          licensee: { countryCode: 'GB-ENG' }
        })

        salesApi.createTransaction.mockReturnValueOnce({
          cost: i,
          id: permit
        })
      })

      const expectedData = []
      permits.forEach((permit, i) => {
        expectedData.push([
          {
            amount: i * 100,
            description: 'The recurring card payment for your rod fishing licence',
            reference: permit,
            authorisation_mode: 'agreement',
            agreement_id: agreementIds[i]
          }
        ])
      })

      await execute()
      expect(sendPayment.mock.calls).toEqual(expectedData)
    })

    it('gets the payment status for each one', async () => {
      const mockGetDueRecurringPayments = []
      const agreementIds = []
      for (let i = 0; i < count; i++) {
        const agreementId = Symbol(`agreementId${1}`)
        agreementIds.push(agreementId)
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment({ agreementId }))
      }
      salesApi.getDueRecurringPayments.mockReturnValueOnce(mockGetDueRecurringPayments)

      const permits = []
      for (let i = 0; i < count; i++) {
        permits.push(Symbol(`permit${i}`))
      }

      permits.forEach((permit, i) => {
        salesApi.preparePermissionDataForRenewal.mockReturnValueOnce({
          licensee: { countryCode: 'GB-ENG' }
        })

        salesApi.createTransaction.mockReturnValueOnce({
          cost: i,
          id: permit
        })
      })

      const expectedData = []
      permits.forEach((_, index) => {
        const paymentId = `payment-id-${index}`
        expectedData.push(paymentId)
        const mockPaymentResponse = { payment_id: paymentId }
        sendPayment.mockResolvedValueOnce(mockPaymentResponse)
      })

      await execute()
      expectedData.forEach(paymentId => {
        expect(getPaymentStatus).toHaveBeenCalledWith(paymentId)
      })
    })
  })
})
