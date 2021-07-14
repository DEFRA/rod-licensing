import { createStagingException, createTransactionFileException, createDataValidationError } from '../../../services/exceptions/exceptions.service.js'
import stagingExceptionsRoute from '../staging-exceptions.js'
import Joi from 'joi'
const [{ options: { handler: stagingExceptionsHandler, validate: { payload: payloadValidationSchema } } }] = stagingExceptionsRoute
jest.mock('../../../services/exceptions/exceptions.service.js')
jest.mock('../../../schema/validators/validators.js', () => ({
  ...jest.requireActual('../../../schema/validators/validators.js'),
  createOptionSetValidator: () => async () => undefined,
  createEntityIdValidator: () => async () => undefined,
  createAlternateKeyValidator: () => async () => undefined,
  createReferenceDataEntityValidator: () => async () => undefined,
  createPermitConcessionValidator: () => async () => undefined
}))

const server = null

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
        createDataValidationError.mockResolvedValue()
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
          expect(createDataValidationError).not.toHaveBeenCalled()
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
          expect(createDataValidationError).toHaveBeenCalledWith(record)
        })
      })
    })

    it('validation fails if the payload is invalid', async () => {
      const func = () => Joi.assert({}, payloadValidationSchema)
      expect(func).toThrow()
    })
  })
})

const getMockResponseToolkit = (code = jest.fn()) => ({
  response: jest.fn(() => ({
    code
  }))
})
