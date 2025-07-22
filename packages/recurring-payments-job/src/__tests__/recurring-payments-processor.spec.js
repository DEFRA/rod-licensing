import { salesApi } from '@defra-fish/connectors-lib'
import { PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { processRecurringPayments } from '../recurring-payments-processor.js'
import { getPaymentStatus, sendPayment } from '../services/govuk-pay-service.js'
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
    getDueRecurringPayments: jest.fn(() => []),
    preparePermissionDataForRenewal: jest.fn(() => ({
      licensee: { countryCode: 'GB-ENG' }
    })),
    createTransaction: jest.fn(() => ({
      id: 'test-transaction-id',
      cost: 30
    })),
    processRPResult: jest.fn(),
    updatePaymentJournal: jest.fn(),
    getPaymentJournal: jest.fn()
  }
}))
jest.mock('../services/govuk-pay-service.js', () => ({
  sendPayment: jest.fn(),
  getPaymentStatus: jest.fn()
}))
jest.mock('debug', () => jest.fn(() => jest.fn()))

const debugMock = db.mock.results[0].value
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

describe('recurring-payments-processor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RUN_RECURRING_PAYMENTS = 'true'
    global.setTimeout = jest.fn((cb, ms) => cb())
  })

  it('debug displays "Recurring Payments job disabled" when env is false', async () => {
    process.env.RUN_RECURRING_PAYMENTS = 'false'

    await processRecurringPayments()

    expect(debugMock).toHaveBeenCalledWith('Recurring Payments job disabled')
  })

  it('debug displays "Recurring Payments job enabled" when env is true', async () => {
    await processRecurringPayments()

    expect(debugMock).toHaveBeenCalledWith('Recurring Payments job enabled')
  })

  it('get recurring payments is called when env is true', async () => {
    const date = new Date().toISOString().split('T')[0]

    await processRecurringPayments()

    expect(salesApi.getDueRecurringPayments).toHaveBeenCalledWith(date)
  })

  it('debug displays "Recurring Payments found: " when env is true', async () => {
    await processRecurringPayments()

    expect(debugMock).toHaveBeenCalledWith('Recurring Payments found: ', [])
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

  it('raises an error if createTransaction fails', async () => {
    salesApi.getDueRecurringPayments.mockReturnValueOnce([getMockDueRecurringPayment()])
    const error = 'Wuh-oh!'
    salesApi.createTransaction.mockImplementationOnce(() => {
      throw new Error(error)
    })

    await expect(processRecurringPayments()).rejects.toThrowError(error)
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

  it('debug should log payment status for recurring payment', async () => {
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
    const mockStatus = getPaymentStatusSuccess()
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(mockResponse)
    salesApi.createTransaction.mockResolvedValueOnce({
      id: mockPaymentId
    })
    const mockPaymentResponse = { payment_id: mockPaymentId, agreementId: 'agreement-1' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(mockStatus)

    await processRecurringPayments()

    expect(debugMock).toHaveBeenCalledWith(`Payment status for ${mockPaymentId}: ${mockStatus.state.status}`)
  })

  it('debug should inform that the recurring payment has been processed', async () => {
    const mockTransactionId = 'test-transaction-id'
    salesApi.createTransaction.mockReturnValueOnce({
      cost: 50
    })
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
      id: mockTransactionId
    })
    const mockPaymentResponse = { payment_id: 'payment-id', agreementId: 'agreement-1' }
    sendPayment.mockResolvedValueOnce(mockPaymentResponse)
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

    await processRecurringPayments()

    expect(debugMock).toHaveBeenCalledWith(`Processed Recurring Payment for ${mockTransactionId}`)
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
    const mockTransactionId = 'test-transaction-id'
    const mockPaymentId = 'test-payment-id'
    const mockPaymentCreatedDate = '2025-01-01T00:00:00.000Z'
    salesApi.getDueRecurringPayments.mockResolvedValueOnce(getMockPaymentRequestResponse())
    salesApi.createTransaction.mockResolvedValueOnce({ id: mockTransactionId, cost: 30 })
    sendPayment.mockResolvedValueOnce({ payment_id: mockPaymentId, agreementId: 'agreement-1', created_date: mockPaymentCreatedDate })
    getPaymentStatus.mockResolvedValueOnce(getPaymentStatusSuccess())

    await processRecurringPayments()

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
        permits.push(`permit${i}`)
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

const getMockDueRecurringPayment = (referenceNumber = '123', agreementId = 'test-agreement-id') => ({
  entity: { agreementId },
  expanded: { activePermission: { entity: { referenceNumber } } }
})
