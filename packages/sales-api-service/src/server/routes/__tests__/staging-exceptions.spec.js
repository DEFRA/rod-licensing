import { createStagingException, createTransactionFileException } from '../../../services/exceptions/exceptions.service.js'
import { createPoclValidationError, getPoclValidationErrors, updatePoclValidationError } from '../../../services/exceptions/pocl-validation-errors.service.js'
import stagingExceptionsRoute from '../staging-exceptions.js'
import Joi from 'joi'
const [
  { options: { handler: stagingExceptionsHandler, validate: { payload: payloadValidationSchema } } },
  { options: { handler: getPoclValidationErrorsHandler } },
  { options: { handler: patchPoclValidationErrorsHandler, validate: { params: poclValidationErrorParamsSchema, payload: updatePoclValidationErrorPayload } } }
] = stagingExceptionsRoute
jest.mock('../../../services/exceptions/exceptions.service.js')
jest.mock('../../../schema/validators/validators.js', () => ({
  ...jest.requireActual('../../../schema/validators/validators.js'),
  createOptionSetValidator: () => async () => undefined,
  createEntityIdValidator: () => async () => undefined,
  createAlternateKeyValidator: () => async () => undefined,
  createReferenceDataEntityValidator: () => async () => undefined,
  createPermitConcessionValidator: () => async () => undefined
}))

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
        description: '{ "json": "string" }',
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
          await stagingExceptionsHandler({ payload: { statusCode: 422, transactionFileException } }, getMockResponseToolkit())
          expect(createPoclValidationError).not.toHaveBeenCalled()
        })
        it('and record is in payload, creates a data validation error', async () => {
          const record = {
            id: 'test-id',
            createTransactionPayload: {
              dataSource: 'Post Office Sales',
              serialNumber: '14345-48457J',
              permissions: []
            },
            finaliseTransactionPayload: {
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
          }
          const payload = { statusCode: 422, transactionFileException, record }
          await stagingExceptionsHandler({ payload }, getMockResponseToolkit())
          expect(createPoclValidationError).toHaveBeenCalledWith(record)
        })
      })
    })

    it('validation fails if the payload is invalid', async () => {
      const func = () => Joi.assert({}, payloadValidationSchema)
      expect(func).toThrow()
    })
  })

  describe('getPoclValidationErrors', () => {
    const poclValidationError = Object.freeze([{
      id: 'string',
      firstName: 'string',
      lastName: 'string',
      birthDate: '1987-01-05',
      postcode: 'AB12 3CD',
      country: 'GB',
      preferredMethodOfConfirmation: 'Text',
      preferredMethodOfNewsletter: 'Email',
      preferredMethodOfReminder: 'Email',
      startDate: '2021-06-06',
      permitId: 'adfcbe49-f1a7-4cde-859a-7642effa61a0',
      amount: 20,
      transactionDate: '2021-06-06',
      paymentSource: 'Post Office Sales',
      channelId: 'ABCD-1234',
      methodOfPayment: 'Debit card',
      dataSource: 'Post Office Sales',
      status: 'Ready for Processing',
      stateCode: 0
    }])

    beforeEach(() => {
      getPoclValidationErrors.mockResolvedValueOnce(poclValidationError)
    })

    it('retrieves POCL validation errors', async () => {
      await getPoclValidationErrorsHandler({ }, getMockResponseToolkit())
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
    const poclValidationError = Object.freeze([{
      id: 'string',
      firstName: 'string',
      lastName: 'string',
      birthDate: '1987-01-05',
      postcode: 'AB12 3CD',
      country: 'GB',
      preferredMethodOfConfirmation: 'Text',
      preferredMethodOfNewsletter: 'Email',
      preferredMethodOfReminder: 'Email',
      startDate: '2021-06-06',
      permitId: 'adfcbe49-f1a7-4cde-859a-7642effa61a0',
      amount: 20,
      transactionDate: '2021-06-06',
      paymentSource: 'Post Office Sales',
      channelId: 'ABCD-1234',
      methodOfPayment: 'Debit card',
      dataSource: 'Post Office Sales',
      status: 'Processed'
    }])

    beforeEach(() => {
      updatePoclValidationError.mockResolvedValueOnce(poclValidationError)
    })

    it('retrieves POCL validation errors', async () => {
      await patchPoclValidationErrorsHandler({ }, getMockResponseToolkit())
      expect(patchPoclValidationErrorsHandler).toHaveBeenCalledWith()
    })

    it('status code is ok', async () => {
      const codeMock = jest.fn()
      const responseToolkit = getMockResponseToolkit(codeMock)
      await patchPoclValidationErrorsHandler({}, responseToolkit)
      expect(codeMock).toHaveBeenCalledWith(200)
    })
  })
})

const getMockResponseToolkit = (code = jest.fn()) => ({
  response: jest.fn(() => ({
    code
  }))
})
