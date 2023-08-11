import { processPoclValidationErrors } from '../pocl-validation-errors'
import { salesApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    getPoclValidationErrorsForProcessing: jest.fn(),
    createTransactions: jest.fn(() => [{ statusCode: 201, response: { id: 'test-response-id' } }]),
    finaliseTransaction: jest.fn(),
    updatePoclValidationError: jest.fn()
  }
}))

const getPoclValidationError = overrides => ({
  id: 'test-pocl-validation-error-id',
  dataSource: { label: 'Post Office Sales' },
  serialNumber: '12345-ABCDE',
  firstName: 'Daniel',
  lastName: 'Ricciardo',
  organisation: 'Fishy Endeavours',
  premises: '14 Howecroft Court',
  street: 'Eastmead Lane',
  town: 'Bristol',
  postcode: 'BS9 1HJ',
  country: 'GB',
  birthDate: '1989-07-01',
  email: 'daniel-ricc@example.co.uk',
  mobilePhone: '07722 123456',
  preferredMethodOfConfirmation: { label: 'Text' },
  preferredMethodOfNewsletter: { label: 'Email' },
  preferredMethodOfReminder: { label: 'Email' },
  postalFulfilment: true,
  concessions: '[{"type":"Blue Badge","referenceNumber":"123456789"}]',
  startDate: '2021-06-15',
  newStartDate: '2021-06-15',
  permitId: 'test-permit-id',
  transactionDate: '2020-01-01T14:00:00Z',
  amount: 30,
  paymentSource: 'Post Office Sales',
  newPaymentSource: { label: 'Post Office Sales' },
  channelId: '948594',
  methodOfPayment: { label: 'Cash' },
  status: { label: 'Ready for Processing' },
  transactionFile: 'test-pocl-file.xml',
  ...overrides
})

const getFinalisationError = (status, error) => ({
  status,
  error,
  message: 'The transaction has already been finalised',
  body: {
    data: { status: { id: 'FINALISED', messageId: 'message2' } }
  }
})

describe('pocl-validation-errors', () => {
  beforeEach(jest.clearAllMocks)

  it('retrieves validation errors from the Sales Api', async () => {
    await processPoclValidationErrors()
    expect(salesApi.getPoclValidationErrorsForProcessing).toBeCalled()
  })

  describe('when no validation errors are returned from Sales Api', () => {
    beforeAll(() => {
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue(null)
    })

    it('returns undefined', async () => {
      const result = await processPoclValidationErrors()
      expect(result).toBeUndefined()
    })

    it('does not attempt to create transactions', async () => {
      await processPoclValidationErrors()
      expect(salesApi.createTransactions).not.toBeCalled()
    })

    it('does not finalise transactions which have failed', async () => {
      await processPoclValidationErrors()
      expect(salesApi.finaliseTransaction).not.toBeCalled()
    })
  })

  describe('processes successfully fixed validation errors', () => {
    beforeAll(() => {
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([getPoclValidationError()])
    })

    it('creates transaction in the Sales Api', async () => {
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload).toMatchSnapshot()
    })

    it('uses startDate if this is provided', async () => {
      const startDate = '2023-07-15'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([getPoclValidationError({ startDate })])
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.permissions[0].startDate).toBe(startDate)
    })

    it("uses startDateUV if startDate isn't provided", async () => {
      const startDateUV = '2023-07-15'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([getPoclValidationError({ startDateUV, startDate: undefined })])
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.permissions[0].startDate).toBe(startDateUV)
    })

    it('uses country if this is provided', async () => {
      const country = 'GB-ENG'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([getPoclValidationError({ country })])
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.permissions[0].licensee.country).toBe(country)
    })

    it("uses countryUV if country isn't provided", async () => {
      const countryUV = 'GB-ENG'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([getPoclValidationError({ countryUV, country: undefined })])
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.permissions[0].licensee.country).toBe(countryUV)
    })

    it('uses paymentSource if this is provided', async () => {
      const paymentSource = 'Post Office Sales'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([getPoclValidationError({ paymentSource })])
      await processPoclValidationErrors()
      const finaliseTransaction = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransaction.payment.source).toBe(paymentSource)
    })

    it("uses paymentSourceUV if paymentSource isn't provided", async () => {
      const paymentSourceUV = 'Fire Sales'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([
        getPoclValidationError({ paymentSourceUV, paymentSource: undefined })
      ])
      await processPoclValidationErrors()
      const finaliseTransaction = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransaction.payment.source).toBe(paymentSourceUV)
    })

    it('finalises the transaction in the Sales Api', async () => {
      await processPoclValidationErrors()
      const [record] = salesApi.finaliseTransaction.mock.calls
      expect(record).toMatchSnapshot()
    })

    it('updates POCL validation error record in the Sales Api', async () => {
      await processPoclValidationErrors()
      const [record] = salesApi.updatePoclValidationError.mock.calls
      expect(record).toMatchSnapshot()
    })

    it('treats 410 Gone errors from the Sales API as a success', async () => {
      salesApi.finaliseTransaction.mockRejectedValueOnce(getFinalisationError(410, 'Gone'))
      await processPoclValidationErrors()

      const [record] = salesApi.updatePoclValidationError.mock.calls
      expect(record).toMatchSnapshot()
    })
  })

  describe('processes failed fixes of validation errors', () => {
    beforeEach(() => {
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([getPoclValidationError({ email: 'daniel-ricc@example.couk' })])
      salesApi.createTransactions.mockResolvedValueOnce([
        { statusCode: 422, message: '"permissions[0].licensee.email" must be a valid email' }
      ])
    })

    it('creates transaction in the Sales Api', async () => {
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload).toMatchSnapshot()
    })

    it('does not finalise transactions which have failed', async () => {
      await processPoclValidationErrors()
      expect(salesApi.finaliseTransaction).not.toBeCalled()
    })

    it('updates POCL validation error record in the Sales Api', async () => {
      await processPoclValidationErrors()
      const [record] = salesApi.updatePoclValidationError.mock.calls
      expect(record).toMatchSnapshot()
    })
  })

  describe('processes records which failed during finalising', () => {
    beforeAll(() => {
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([getPoclValidationError({ email: 'daniel-ricc@example.couk' })])
    })

    it('creates transaction in the Sales Api', async () => {
      salesApi.finaliseTransaction.mockRejectedValueOnce(getFinalisationError(500, 'Internal server error'))
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload).toMatchSnapshot()
    })

    it('attempts to finalise transaction in the Sales Api', async () => {
      salesApi.finaliseTransaction.mockRejectedValueOnce(getFinalisationError(500, 'Internal server error'))
      await processPoclValidationErrors()
      const [record] = salesApi.finaliseTransaction.mock.calls
      expect(record).toMatchSnapshot()
    })

    it('updates POCL validation error record in the Sales Api', async () => {
      salesApi.finaliseTransaction.mockRejectedValueOnce(getFinalisationError(500, 'Internal server error'))
      await processPoclValidationErrors()
      const [record] = salesApi.updatePoclValidationError.mock.calls
      expect(record).toMatchSnapshot()
    })
  })

  describe('when an existing POCL validation error has no datasource', () => {
    it('fills it with the correct data for postal orders', async () => {
      const poclValidationError = getPoclValidationError({ dataSource: null, newPaymentSource: { label: 'Postal Order' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])
      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.dataSource).toBe('Postal Order Sales')
    })

    it('leaves the datatype blank if payment source is not postal order', async () => {
      const poclValidationError = getPoclValidationError({ dataSource: null, newPaymentSource: { label: 'Magic beans' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])
      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.dataSource).toBeUndefined()
    })

    it('leaves the datatype blank if payment source is not set', async () => {
      const poclValidationError = getPoclValidationError({ dataSource: null, newPaymentSource: null })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])
      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.dataSource).toBeUndefined()
    })
  })

  describe('when an existing POCL validation error has no serial number', () => {
    it('fills it with the correct data for postal orders', async () => {
      const poclValidationError = getPoclValidationError({ serialNumber: null, newPaymentSource: { label: 'Postal Order' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])

      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.serialNumber).toBe('Postal Order Sales')
    })

    it('leaves the datatype blank if payment source is not postal order', async () => {
      const poclValidationError = getPoclValidationError({ serialNumber: null, newPaymentSource: { label: 'Magic Beans' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])

      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.serialNumber).toBeUndefined()
    })

    it('leaves the datatype blank if payment source is not set', async () => {
      const poclValidationError = getPoclValidationError({ serialNumber: null, newPaymentSource: null })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])

      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.serialNumber).toBeUndefined()
    })
  })

  describe('when an existing POCL validation error has no method of payment', () => {
    it('fills it with the correct data for postal orders', async () => {
      const poclValidationError = getPoclValidationError({ methodOfPayment: null, newPaymentSource: { label: 'Postal Order' } })
      poclValidationError.methodOfPayment = null
      poclValidationError.newPaymentSource = { label: 'Postal Order' }
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])

      await processPoclValidationErrors()

      const finaliseTransactionPayload = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransactionPayload.payment.method).toBe('Other')
    })

    it('leaves the payment method blank if payment source is not postal order', async () => {
      const poclValidationError = getPoclValidationError({ methodOfPayment: null, newPaymentSource: { label: 'Magic Beans' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])

      await processPoclValidationErrors()

      const finaliseTransactionPayload = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransactionPayload.payment.method).toBeUndefined()
    })

    it('leaves the payment method blank if payment source is not set', async () => {
      const poclValidationError = getPoclValidationError({ methodOfPayment: null, newPaymentSource: null })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])

      await processPoclValidationErrors()

      const finaliseTransactionPayload = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransactionPayload.payment.method).toBeUndefined()
    })
  })

  describe('when a date is not in ISO format', () => {
    it('converts the issueDate to ISO format without milliseconds', async () => {
      const poclValidationError = getPoclValidationError()
      poclValidationError.transactionDate = '01/01/2023'

      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])
      salesApi.createTransactions.mockResolvedValue([{ statusCode: 201, response: { id: 'test-response-id' } }])
      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      const expectedDate = '2023-01-01T00:00:00Z'
      expect(createTransactionPayload.permissions[0].issueDate).toBe(expectedDate)
    })

    it('converts the startDate to ISO format without milliseconds', async () => {
      const poclValidationError = getPoclValidationError()
      poclValidationError.startDate = '01/01/2023'

      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])
      salesApi.createTransactions.mockResolvedValue([{ statusCode: 201, response: { id: 'test-response-id' } }])
      await processPoclValidationErrors()

      const validationError = salesApi.createTransactions.mock.calls[0][0][0]
      const expectedDate = '2023-01-01T00:00:00Z'
      expect(validationError.permissions[0].startDate).toBe(expectedDate)
    })

    it('converts the startDate to ISO format without milliseconds', async () => {
      const poclValidationError = getPoclValidationError()
      poclValidationError.startDate = '01/01/2023'

      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])
      salesApi.createTransactions.mockResolvedValue([{ statusCode: 201, response: { id: 'test-response-id' } }])
      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      const expectedDate = '2023-01-01T00:00:00Z'
      expect(createTransactionPayload.permissions[0].startDate).toBe(expectedDate)
    })

    it('converts the payment timestamp to ISO format without milliseconds', async () => {
      const poclValidationError = getPoclValidationError()
      poclValidationError.transactionDate = '01/01/2023'

      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])
      salesApi.createTransactions.mockResolvedValue([{ statusCode: 201, response: { id: 'test-response-id' } }])
      await processPoclValidationErrors()

      const finaliseTransactionPayload = salesApi.finaliseTransaction.mock.calls[0][1]
      const expectedDate = '2023-01-01T00:00:00Z'
      expect(finaliseTransactionPayload.payment.timestamp).toBe(expectedDate)
    })
  })
})
