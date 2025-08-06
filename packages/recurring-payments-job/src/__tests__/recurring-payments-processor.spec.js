import { salesApi } from '@defra-fish/connectors-lib'
import { PAYMENT_STATUS, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { processRecurringPayments } from '../recurring-payments-processor.js'
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
  salesApi: {
    createPaymentJournal: jest.fn(),
    createTransaction: jest.fn(() => ({
      id: 'test-transaction-id',
      cost: 30
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

const getMockDueRecurringPayment = (referenceNumber = '123', agreementId = 'test-agreement-id') => ({
  entity: { agreementId },
  expanded: { activePermission: { entity: { referenceNumber } } }
})

describe('recurring-payments-processor', () => {
  const [{ value: debugLogger }] = db.mock.results

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RUN_RECURRING_PAYMENTS = 'true'
    global.setTimeout = jest.fn((cb, ms) => cb())
  })

  it('debug log displays "Recurring Payments job disabled" when env is false', async () => {
    process.env.RUN_RECURRING_PAYMENTS = 'false'

    await processRecurringPayments()

    expect(debugLogger).toHaveBeenCalledWith('Recurring Payments job disabled')
  })

  it('debug log displays "Recurring Payments job enabled" when env is true', async () => {
    await processRecurringPayments()

    expect(debugLogger).toHaveBeenCalledWith('Recurring Payments job enabled')
  })

  it('throws if Gov.UK Pay is not healthy', async () => {
    isGovPayUp.mockResolvedValueOnce(false)
    await expect(() => processRecurringPayments()).rejects.toThrow('Run aborted, Gov.UK Pay health endpoint is reporting problems.')
  })

  it('get recurring payments is called when env is true', async () => {
    const date = new Date().toISOString().split('T')[0]

    await processRecurringPayments()

    expect(salesApi.getDueRecurringPayments).toHaveBeenCalledWith(date)
  })

  it('debug log displays "Recurring Payments found:" when env is true', async () => {
    await processRecurringPayments()

    expect(debugLogger).toHaveBeenNthCalledWith(2, 'Recurring Payments found:', [])
  })

  describe('When RP fetch throws an error...', () => {
    it('processRecurringPayments re-throws the error', async () => {
      const error = new Error('Test error')
      salesApi.getDueRecurringPayments.mockImplementationOnce(() => {
        throw error
      })

      await expect(processRecurringPayments()).rejects.toThrowError(error)
    })

    it('calls console.error with error message', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      const error = new Error('Test error')
      salesApi.getDueRecurringPayments.mockImplementationOnce(() => {
        throw error
      })

      try {
        await processRecurringPayments()
      } catch {}

      expect(errorSpy).toHaveBeenCalledWith('Run aborted. Error fetching due recurring payments:', error)
    })
  })

  describe('When payment request throws an error...', () => {
    it('debug is called with error message', async () => {
      salesApi.getDueRecurringPayments.mockReturnValueOnce(getMockPaymentRequestResponse())
      const oopsie = new Error('payment gate down')
      sendPayment.mockRejectedValueOnce(oopsie)

      try {
        await processRecurringPayments()
      } catch {}

      expect(debugLogger).toHaveBeenCalledWith(expect.any(String), oopsie)
    })

    it('prepares and sends all payment requests, even if some fail', async () => {
      const agreementIds = [Symbol('agreementId1'), Symbol('agreementId2'), Symbol('agreementId3'), Symbol('agreementId4')]
      salesApi.getDueRecurringPayments.mockReturnValueOnce([
        getMockDueRecurringPayment('fee', agreementIds[0]),
        getMockDueRecurringPayment('fi', agreementIds[1]),
        getMockDueRecurringPayment('foe', agreementIds[2]),
        getMockDueRecurringPayment('fum', agreementIds[3])
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

      await processRecurringPayments()

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
      const errors = [new Error('error 1'), new Error('error 2'), new Error('error 3')]
      salesApi.getDueRecurringPayments.mockReturnValueOnce([
        getMockDueRecurringPayment('fee', 'a1'),
        getMockDueRecurringPayment('fi', 'a2'),
        getMockDueRecurringPayment('foe', 'a3')
      ])
      const permissionData = { licensee: { countryCode: 'GB-ENG' } }
      salesApi.preparePermissionDataForRenewal
        .mockRejectedValueOnce(errors[0])
        .mockReturnValueOnce(permissionData)
        .mockReturnValueOnce(permissionData)
      salesApi.createTransaction.mockRejectedValueOnce(errors[1]).mockReturnValueOnce({ cost: 50, id: 'transaction-id-3' })
      sendPayment.mockRejectedValueOnce(errors[2])

      await processRecurringPayments()

      expect(debugLogger).toHaveBeenCalledWith(expect.any(String), ...errors)
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

      await processRecurringPayments()

      expect(getPaymentStatus).toHaveBeenCalledTimes(6)
    })
  })

  it('prepares the data for found recurring payments', async () => {
    const referenceNumber = Symbol('reference')
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment(referenceNumber)])
    const mockPaymentResponse = { payment_id: 'test-payment-id', created_date: '2025-01-01T00:00:00.000Z' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

    await processRecurringPayments()

    expect(salesApi.preparePermissionDataForRenewal).toHaveBeenCalledWith(referenceNumber)
  })

  it('creates a transaction with the correct data', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])

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
      agreementId: 'test-agreement-id',
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

    await processRecurringPayments()

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

    await processRecurringPayments()

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

    await processRecurringPayments()

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

    await processRecurringPayments()

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

    await processRecurringPayments()

    expect(salesApi.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: [expect.objectContaining({ startDate: '2020-03-14T00:00:00.000Z' })]
      })
    )
  })

  it('prepares and sends the payment request', async () => {
    const agreementId = Symbol('agreementId')
    const transactionId = 'transactionId'

    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment('foo', agreementId)])

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

    await processRecurringPayments()

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

    await processRecurringPayments()

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

    await processRecurringPayments()

    console.log(debugLogger.mock.calls)
    expect(debugLogger).toHaveBeenCalledWith(`Payment status for ${mockPaymentId}: ${PAYMENT_STATUS.Success}`)
  })

  it('logs an error if createTransaction fails', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    const error = new Error('Wuh-oh!')
    salesApi.createTransaction.mockImplementationOnce(() => {
      throw error
    })

    await processRecurringPayments()

    expect(debugLogger).toHaveBeenCalledWith(expect.any(String), error)
  })

  it.each([
    [400, 'Failed to fetch status for payment test-payment-id, error 400'],
    [486, 'Failed to fetch status for payment test-payment-id, error 486'],
    [499, 'Failed to fetch status for payment test-payment-id, error 499'],
    [500, 'Payment status API error for test-payment-id, error 500'],
    [512, 'Payment status API error for test-payment-id, error 512'],
    [599, 'Payment status API error for test-payment-id, error 599']
  ])('logs the correct message when getPaymentStatus rejects with HTTP %i', async (statusCode, expectedMessage) => {
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

    await processRecurringPayments()

    expect(debugLogger).toHaveBeenCalledWith(expectedMessage)
  })

  it('logs the generic unexpected-error message and still rejects', async () => {
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

    await processRecurringPayments()

    expect(debugLogger).toHaveBeenCalledWith(`Unexpected error fetching payment status for ${mockPaymentId}.`)
  })

  it('should call setTimeout with correct delay when there are recurring payments', async () => {
    const referenceNumber = Symbol('reference')
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([getMockDueRecurringPayment(referenceNumber)])
    const mockPaymentResponse = { payment_id: 'test-payment-id' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())

    await processRecurringPayments()

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), PAYMENT_STATUS_DELAY)
  })

  it('should not call setTimeout when there are no recurring payments', async () => {
    salesApi.getDueRecurringPayments.mockResolvedValueOnce([])

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())

    await processRecurringPayments()

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

    await processRecurringPayments()

    console.log(salesApi.processRPResult.mock.calls, mockTransactionId, mockPaymentId, mockPaymentCreatedDate)
    expect(salesApi.processRPResult).toHaveBeenCalledWith(mockTransactionId, mockPaymentId, mockPaymentCreatedDate)
  })

  it("doesn't call processRPResult if payment status is not successful", async () => {
    const mockPaymentId = 'test-payment-id'
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(getMockPaymentRequestResponse())
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockPaymentId, cost: 30 })
    sendPayment.mockResolvedValueOnce({ payment_id: mockPaymentId, agreementId: 'agreement-1' })
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusFailure())

    await processRecurringPayments()

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
      salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment('reference', agreementId)])
      const mockPaymentResponse = { payment_id: 'test-payment-id', created_date: '2025-01-01T00:00:00.000Z' }
      sendPayment.mockResolvedValueOnce(mockPaymentResponse)
      getPaymentStatus.mockResolvedValueOnce(mockStatus)

      await processRecurringPayments()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Payment failed. Recurring payment agreement for: ${agreementId} set to be cancelled. Updating payment journal.`
      )
    }
  )

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

    await processRecurringPayments()

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

    await processRecurringPayments()

    expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
  })

  describe.each([2, 3, 10])('if there are %d recurring payments', count => {
    it('prepares the data for each one', async () => {
      const references = []
      for (let i = 0; i < count; i++) {
        references.push(Symbol('reference' + i))
      }
      const mockGetDueRecurringPayments = []
      references.forEach(reference => {
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment(reference))
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

      await processRecurringPayments()

      expect(salesApi.preparePermissionDataForRenewal.mock.calls).toEqual(expectedData)
    })

    it('creates a transaction for each one', async () => {
      const mockGetDueRecurringPayments = []
      for (let i = 0; i < count; i++) {
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment(i))
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
      permits.forEach(permit => {
        expectedData.push([
          {
            dataSource: 'Recurring Payment',
            agreementId: 'test-agreement-id',
            permissions: [expect.objectContaining({ permitId: permit })]
          }
        ])
      })

      await processRecurringPayments()

      expect(salesApi.createTransaction.mock.calls).toEqual(expectedData)
    })

    it('sends a payment for each one', async () => {
      const mockGetDueRecurringPayments = []
      const agreementIds = []
      for (let i = 0; i < count; i++) {
        const agreementId = Symbol(`agreementId${1}`)
        agreementIds.push(agreementId)
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment(i, agreementId))
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

      await processRecurringPayments()
      expect(sendPayment.mock.calls).toEqual(expectedData)
    })

    it('gets the payment status for each one', async () => {
      const mockGetDueRecurringPayments = []
      const agreementIds = []
      for (let i = 0; i < count; i++) {
        const agreementId = Symbol(`agreementId${1}`)
        agreementIds.push(agreementId)
        mockGetDueRecurringPayments.push(getMockDueRecurringPayment(i, agreementId))
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

      await processRecurringPayments()
      expectedData.forEach(paymentId => {
        expect(getPaymentStatus).toHaveBeenCalledWith(paymentId)
      })
    })
  })
})
