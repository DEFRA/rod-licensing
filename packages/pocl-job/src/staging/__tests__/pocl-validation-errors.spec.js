import { processPoclValidationErrors } from '../pocl-validation-errors'
import { salesApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    getPoclValidationErrorsForProcessing: jest.fn(),
    createTransactions: jest.fn(),
    finaliseTransaction: jest.fn(),
    updatePoclValidationError: jest.fn()
  }
}))

const getPoclValidationError = () => ({
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
  transactionFile: 'test-pocl-file.xml'
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
    let result
    beforeEach(async () => {
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue(null)
      result = await processPoclValidationErrors()
    })

    it('returns undefined', () => {
      expect(result).toBe(undefined)
    })

    it('does not attempt to create transactions', () => {
      expect(salesApi.createTransactions).not.toBeCalled()
    })

    it('does not finalise transactions which have failed', () => {
      expect(salesApi.finaliseTransaction).not.toBeCalled()
    })
  })

  describe('processes successfully fixed validation errors', () => {
    let poclValidationError
    beforeEach(async () => {
      poclValidationError = getPoclValidationError()
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])
      salesApi.createTransactions.mockResolvedValue([{ statusCode: 201, response: { id: 'test-response-id' } }])
      await processPoclValidationErrors()
    })

    it('creates transaction in the Sales Api', () => {
      const validationError = salesApi.createTransactions.mock.calls[0][0][0]
      expect(validationError).toMatchSnapshot()
    })

    it('finalises the transaction in the Sales Api', () => {
      const record = salesApi.finaliseTransaction.mock.calls[0]
      expect(record).toMatchSnapshot()
    })

    it('updates POCL validation error record in the Sales Api', () => {
      const record = salesApi.updatePoclValidationError.mock.calls[0]
      expect(record).toMatchSnapshot()
    })

    it('treats 410 Gone errors from the Sales API as a success', async () => {
      salesApi.finaliseTransaction.mockRejectedValueOnce(getFinalisationError(410, 'Gone'))
      await processPoclValidationErrors()

      const record = salesApi.updatePoclValidationError.mock.calls[0]
      expect(record).toMatchSnapshot()
    })
  })

  describe('processes failed fixes of validation errors', () => {
    let poclValidationError
    beforeEach(async () => {
      poclValidationError = getPoclValidationError()
      poclValidationError.email = 'daniel-ricc@example.couk'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])
      salesApi.createTransactions.mockResolvedValue([{ statusCode: 422, message: '"permissions[0].licensee.email" must be a valid email' }])
      await processPoclValidationErrors()
    })

    it('creates transaction in the Sales Api', () => {
      const validationError = salesApi.createTransactions.mock.calls[0][0][0]
      expect(validationError).toMatchSnapshot()
    })

    it('does not finalise transactions which have failed', () => {
      expect(salesApi.finaliseTransaction).not.toBeCalled()
    })

    it('updates POCL validation error record in the Sales Api', () => {
      const record = salesApi.updatePoclValidationError.mock.calls[0]
      expect(record).toMatchSnapshot()
    })
  })

  describe('processes records which failed during finalising', () => {
    let poclValidationError
    beforeEach(async () => {
      poclValidationError = getPoclValidationError()
      poclValidationError.email = 'daniel-ricc@example.couk'
      salesApi.getPoclValidationErrorsForProcessing.mockResolvedValue([poclValidationError])
      salesApi.createTransactions.mockResolvedValue([{ statusCode: 201, response: { id: 'test-response-id' } }])
      salesApi.finaliseTransaction.mockRejectedValueOnce(getFinalisationError(500, 'Internal server error'))
      await processPoclValidationErrors()
    })

    it('creates transaction in the Sales Api', () => {
      const validationError = salesApi.createTransactions.mock.calls[0][0][0]
      expect(validationError).toMatchSnapshot()
    })

    it('attempts to finalise transaction in the Sales Api', () => {
      const record = salesApi.finaliseTransaction.mock.calls[0]
      expect(record).toMatchSnapshot()
    })

    it('updates POCL validation error record in the Sales Api', () => {
      const record = salesApi.updatePoclValidationError.mock.calls[0]
      expect(record).toMatchSnapshot()
    })
  })
})
