import initialiseServer from '../../index.js'
import { createStagingException, createTransactionFileException } from '../../../services/exceptions/exceptions.service.js'

jest.mock('../../../services/exceptions/exceptions.service.js')
jest.mock('../../../schema/validators/validators.js', () => ({
  ...jest.requireActual('../../../schema/validators/validators.js'),
  createOptionSetValidator: () => async () => undefined,
  createEntityIdValidator: () => async () => undefined,
  createAlternateKeyValidator: () => async () => undefined,
  createReferenceDataEntityValidator: () => async () => undefined,
  createPermitConcessionValidator: () => async () => undefined
}))

let server = null

describe('staging exceptions handler', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('addStagingException', () => {
    it('adds a staging exception if the payload contains a stagingException object', async () => {
      const stagingException = {
        stagingId: 'string',
        description: 'string',
        transactionJson: 'string',
        exceptionJson: 'string'
      }
      createStagingException.mockResolvedValueOnce(stagingException)
      const result = await server.inject({ method: 'POST', url: '/stagingExceptions', payload: { stagingException } })
      expect(createStagingException).toHaveBeenCalledWith(stagingException)
      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({ stagingException })
    })

    it('adds a transaction file exception if the payload contains a transactionFileException object', async () => {
      const transactionFileException = {
        name: 'string',
        description: 'string',
        json: 'string',
        notes: 'string',
        type: 'Failure',
        transactionFile: 'string',
        permissionId: 'string'
      }
      createTransactionFileException.mockResolvedValueOnce(transactionFileException)
      const result = await server.inject({ method: 'POST', url: '/stagingExceptions', payload: { transactionFileException } })
      expect(createTransactionFileException).toHaveBeenCalledWith(transactionFileException)
      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({ transactionFileException })
    })

    it('throws 422 errors if the payload was invalid', async () => {
      const result = await server.inject({ method: 'POST', url: '/stagingExceptions', payload: {} })
      expect(result.statusCode).toBe(422)
      expect(JSON.parse(result.payload)).toMatchObject({
        error: 'Unprocessable Entity',
        message:
          'Invalid payload: "create-staging-exception-request" must contain at least one of [stagingException, transactionFileException]',
        statusCode: 422
      })
    })
  })
})
