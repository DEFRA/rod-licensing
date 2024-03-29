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
  country: { label: 'GB-ENG' },
  birthDate: '1989-07-01',
  email: 'daniel-ricc@example.co.uk',
  mobilePhone: '07722 123456',
  preferredMethodOfConfirmation: { label: 'Text' },
  preferredMethodOfNewsletter: { label: 'Email' },
  preferredMethodOfReminder: { label: 'Email' },
  postalFulfilment: true,
  concessions: '[{"type":"Blue Badge","referenceNumber":"123456789"}]',
  startDate: '2021-06-15',
  startDateUnvalidated: '2021-06-15',
  permitId: 'test-permit-id',
  transactionDate: '2020-01-01T14:00:00Z',
  amount: 30,
  paymentSource: { label: 'Post Office Sales' },
  paymentSourceUnvalidated: 'Post Office Sales',
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
      salesApi.getPoclValidationErrorsForProcessing.mockImplementation(() => [getPoclValidationError()])
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

    it("uses startDateUnvalidated if startDate isn't provided", async () => {
      const startDateUnvalidated = '2023-07-15'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([
        getPoclValidationError({ startDateUnvalidated, startDate: undefined })
      ])
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.permissions[0].startDate).toBe(startDateUnvalidated)
    })

    it('uses country if this is provided', async () => {
      const country = { label: 'GB-ENG' }
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([getPoclValidationError({ country })])
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.permissions[0].licensee.country).toBe(country.label)
    })

    it("uses countryUnvalidated if country isn't provided", async () => {
      const countryUnvalidated = 'England'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([
        getPoclValidationError({ countryUnvalidated, country: undefined })
      ])
      await processPoclValidationErrors()
      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.permissions[0].licensee.country).toBe(countryUnvalidated)
    })

    it('uses paymentSource label if this is provided', async () => {
      const paymentSource = { label: 'Post Office Sales' }
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([getPoclValidationError({ paymentSource })])
      await processPoclValidationErrors()
      const finaliseTransaction = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransaction.payment.source).toBe(paymentSource.label)
    })

    it("uses paymentSourceUnvalidated if paymentSource isn't provided", async () => {
      const paymentSourceUnvalidated = 'Fire Sales'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([
        getPoclValidationError({ paymentSourceUnvalidated, paymentSource: undefined })
      ])
      await processPoclValidationErrors()
      const finaliseTransaction = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransaction.payment.source).toBe(paymentSourceUnvalidated)
    })

    it('populates the channelId with N/A if not provided', async () => {
      const error = getPoclValidationError()
      delete error.channelId
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([error])
      await processPoclValidationErrors()
      const finaliseTransaction = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransaction.payment.channelId).toBe('N/A')
    })

    it("omits transaction file from payload if one isn't provided", async () => {
      const error = getPoclValidationError()
      delete error.transactionFile
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([error])
      await processPoclValidationErrors()
      const finaliseTransaction = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransaction.transactionFile).toBeUndefined()
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

  describe('Create transaction payload datasource', () => {
    it("is set to 'Postal Order Sales' when payment source is 'Postal Order'", async () => {
      const poclValidationError = getPoclValidationError({ dataSource: null, paymentSource: { label: 'Postal Order' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])
      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.dataSource).toBe('Postal Order Sales')
    })

    it("is undefined when payment source is not 'Postal Order'", async () => {
      const poclValidationError = getPoclValidationError({ dataSource: null, paymentSource: { label: 'Magic beans' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])
      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.dataSource).toBeUndefined()
    })

    it('is undefined when payment source is null', async () => {
      const poclValidationError = getPoclValidationError({ dataSource: null, paymentSource: null })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])
      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.dataSource).toBeUndefined()
    })
  })

  describe('Create transaction payload serial number', () => {
    it("is set to 'Postal Order Sales' when paymentSource is 'Postal Order'", async () => {
      const poclValidationError = getPoclValidationError({ serialNumber: null, paymentSource: { label: 'Postal Order' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])

      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.serialNumber).toBe('Postal Order Sales')
    })

    it("is undefined if payment source is not 'Postal Order'", async () => {
      const poclValidationError = getPoclValidationError({ serialNumber: null, paymentSource: { label: 'Magic Beans' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValueOnce([poclValidationError])

      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.serialNumber).toBeUndefined()
    })

    it('is undefined if payment source is not set', async () => {
      const poclValidationError = getPoclValidationError({ serialNumber: null, paymentSource: null })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])

      await processPoclValidationErrors()

      const [[[createTransactionPayload]]] = salesApi.createTransactions.mock.calls
      expect(createTransactionPayload.serialNumber).toBeUndefined()
    })
  })

  describe('Finalise transaction payload payment method', () => {
    it("is 'Other' if payment source is 'Postal Order'", async () => {
      const poclValidationError = getPoclValidationError({ methodOfPayment: null, paymentSource: { label: 'Postal Order' } })
      poclValidationError.methodOfPayment = null
      poclValidationError.paymentSource = { label: 'Postal Order' }
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])

      await processPoclValidationErrors()

      const finaliseTransactionPayload = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransactionPayload.payment.method).toBe('Other')
    })

    it("is undefined if payment source is not 'Postal Order'", async () => {
      const poclValidationError = getPoclValidationError({ methodOfPayment: null, paymentSource: { label: 'Magic Beans' } })
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])

      await processPoclValidationErrors()

      const finaliseTransactionPayload = salesApi.finaliseTransaction.mock.calls[0][1]
      expect(finaliseTransactionPayload.payment.method).toBeUndefined()
    })

    it('is undefined if payment source is not set', async () => {
      const poclValidationError = getPoclValidationError({ methodOfPayment: null, paymentSource: null })
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
