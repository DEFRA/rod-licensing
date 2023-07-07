import { createStagingException, createTransactionFileException } from '../../../services/exceptions/exceptions.service.js'
import {
  createPoclValidationError,
  getPoclValidationErrors,
  updatePoclValidationError
} from '../../../services/exceptions/pocl-validation-errors.service.js'
import stagingExceptionsRoute from '../staging-exceptions.js'
import Joi from 'joi'
const [
  {
    options: {
      handler: stagingExceptionsHandler,
      validate: { payload: payloadValidationSchema }
    }
  },
  {
    options: { handler: getPoclValidationErrorsHandler }
  },
  {
    options: {
      handler: patchPoclValidationErrorsHandler,
      validate: { params: poclValidationErrorParamsSchema, payload: updatePoclValidationErrorPayload }
    }
  }
] = stagingExceptionsRoute

jest.mock('../../../services/exceptions/exceptions.service.js')
jest.mock('../../../services/exceptions/pocl-validation-errors.service.js')
jest.mock('../../../schema/validators/validators.js', () => ({
  ...jest.requireActual('../../../schema/validators/validators.js'),
  createOptionSetValidator: () => async () => undefined,
  createEntityIdValidator: () => async () => undefined,
  createAlternateKeyValidator: () => async () => undefined,
  createReferenceDataEntityValidator: () => async () => undefined,
  createPermitConcessionValidator: () => async () => undefined
}))

const poclValidationError = Object.freeze([
  {
    id: 'string',
    firstName: 'string',
    lastName: 'string',
    birthDate: '1987-01-05',
    postcode: 'AB12 3CD',
    country: 910400195,
    preferredMethodOfConfirmation: 'Text',
    preferredMethodOfNewsletter: 'Email',
    preferredMethodOfReminder: 'Email',
    postalFulfilment: true,
    startDate: '2021-06-06',
    permitId: 'adfcbe49-f1a7-4cde-859a-7642effa61a0',
    amount: 20,
    transactionDate: '2021-06-06',
    paymentSource: 'Post Office Sales',
    channelId: 'ABCD-1234',
    methodOfPayment: 'Debit card',
    dataSource: 'Post Office Sales',
    transactionFile: 'test-pocl-file.xml',
    status: 'Ready for Processing'
  }
])

const record = Object.freeze({
  poclValidationErrorId: 'test-id',
  createTransactionPayload: {
    dataSource: 'Post Office Sales',
    serialNumber: '14345-48457J',
    permitId: 'test-permit-id',
    startDate: '2021-06-15',
    issueDate: '2020-01-01',
    permissions: [
      {
        licensee: {
          firstName: 'Daniel',
          lastName: 'Ricciardo',
          birthDate: '1989-07-01',
          email: 'daniel-ricc@example.couk',
          mobilePhone: '07722 123456',
          organisation: 'Fishy Endeavours',
          postcode: 'BS9 1HJ',
          premises: '14 Howecroft Court',
          street: 'Eastmead Lane',
          town: 'Bristol',
          country: 'GB',
          preferredMethodOfConfirmation: 'Text',
          preferredMethodOfNewsletter: 'Email',
          preferredMethodOfReminder: 'Email',
          postalFulfilment: true
        }
      }
    ]
  },
  finaliseTransactionPayload: {
    transactionFile: 'test-pocl-file.xml',
    payment: {
      timestamp: '2020-01-01T14:00:00Z',
      amount: 30,
      source: 'Post Office Sales',
      channelId: '948594',
      method: 'Cash'
    }
  },
  stage: 'Staging',
  createTransactionError: {
    statusCode: 422,
    error: 'Data validation error',
    message: 'Error'
  }
})

describe('staging exceptions handler', () => {
  beforeEach(jest.clearAllMocks)

  describe('addStagingException', () => {
    describe('if the payload contains a stagingException object', () => {
      const stagingException = Object.freeze({
        stagingId: 'string',
        description: 'string',
        transactionJson: 'string',
        exceptionJson: 'string'
      })

      beforeEach(() => {
        createStagingException.mockResolvedValueOnce(stagingException)
      })

      it('adds a staging exception', async () => {
        await stagingExceptionsHandler({ payload: { stagingException } }, getMockResponseToolkit())
        expect(createStagingException).toHaveBeenCalledWith(stagingException)
      })

      it('status code is ok', async () => {
        const codeMock = jest.fn()
        const responseToolkit = getMockResponseToolkit(codeMock)
        await stagingExceptionsHandler({ payload: { stagingException } }, responseToolkit)
        expect(codeMock).toHaveBeenCalledWith(200)
      })
    })

    describe('if the payload contains a transactionFileException object', () => {
      const transactionFileException = Object.freeze({
        name: 'string',
        description: '{ "statusCode": 422 }',
        json: 'string',
        notes: 'string',
        type: 'Failure',
        transactionFile: 'string',
        permissionId: 'string'
      })

      beforeEach(() => {
        createTransactionFileException.mockResolvedValueOnce(transactionFileException)
        createPoclValidationError.mockResolvedValue()
      })

      it('adds a transaction file exception', async () => {
        await stagingExceptionsHandler({ payload: { transactionFileException } }, getMockResponseToolkit())
        expect(createTransactionFileException).toHaveBeenCalledWith(transactionFileException)
      })

      it('status code is ok', async () => {
        const codeMock = jest.fn()
        const responseToolkit = getMockResponseToolkit(codeMock)
        await stagingExceptionsHandler({ payload: { transactionFileException } }, responseToolkit)
        expect(codeMock).toHaveBeenCalledWith(200)
      })

      describe('if the error is a 422', () => {
        it('and record is not in payload, does not creates a data validation error', async () => {
          await stagingExceptionsHandler({ payload: { transactionFileException } }, getMockResponseToolkit())
          expect(createPoclValidationError).not.toHaveBeenCalled()
        })
        it('and record is in payload, creates a data validation error', async () => {
          await stagingExceptionsHandler({ payload: { transactionFileException, record } }, getMockResponseToolkit())
          expect(createPoclValidationError).toHaveBeenCalledWith(record, transactionFileException.transactionFile)
        })
        it('and record is in payload, with a journalId, it creates a data validation error', async () => {
          const recordJournalId = { ...record }
          recordJournalId.createTransactionPayload.journalId = '123456'
          await stagingExceptionsHandler({ payload: { transactionFileException, record: recordJournalId } }, getMockResponseToolkit())
          expect(createPoclValidationError).toHaveBeenCalledWith(recordJournalId, transactionFileException.transactionFile)
        })
      })
    })

    it('validation fails if the payload is invalid', async () => {
      const func = () => Joi.assert({}, payloadValidationSchema)
      expect(func).toThrow()
    })
  })

  describe('getPoclValidationErrors', () => {
    beforeEach(() => {
      getPoclValidationErrors.mockResolvedValueOnce(poclValidationError)
    })

    it('retrieves POCL validation errors', async () => {
      await getPoclValidationErrorsHandler({}, getMockResponseToolkit())
      expect(getPoclValidationErrors).toHaveBeenCalledWith()
    })

    it('status code is ok', async () => {
      const codeMock = jest.fn()
      const responseToolkit = getMockResponseToolkit(codeMock)
      await getPoclValidationErrorsHandler({}, responseToolkit)
      expect(codeMock).toHaveBeenCalledWith(200)
    })
  })

  describe('patchPoclValidationErrors', () => {
    let request

    beforeEach(() => {
      request = {
        params: {
          id: '04a6ae41-4b5d-4fed-9a79-3b624faae37e'
        },
        payload: record
      }
      updatePoclValidationError.mockResolvedValueOnce(poclValidationError)
    })

    it('update the POCL validation record', async () => {
      await patchPoclValidationErrorsHandler(request, getMockResponseToolkit())
      expect(updatePoclValidationError).toHaveBeenCalledWith(request.params.id, request.payload)
    })

    it('status code is ok', async () => {
      const codeMock = jest.fn()
      const responseToolkit = getMockResponseToolkit(codeMock)
      await patchPoclValidationErrorsHandler(request, responseToolkit)
      expect(codeMock).toHaveBeenCalledWith(200)
    })

    it('validation fails if the id is not a guid', async () => {
      const func = () => Joi.assert('not-a-guid', poclValidationErrorParamsSchema)
      expect(func).toThrow()
    })

    it('validation fails if the payload is invalid', async () => {
      const func = () => Joi.assert(poclValidationError, updatePoclValidationErrorPayload)
      expect(func).toThrow()
    })
  })
})

const getMockResponseToolkit = (code = jest.fn()) => ({
  response: jest.fn(() => ({
    code
  }))
})
