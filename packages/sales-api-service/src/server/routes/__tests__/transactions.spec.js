import initialiseServer from '../../server.js'
import { mockTransactionPayload, mockStagedTransactionRecord } from '../../../__mocks__/test-data.js'
import { v4 as uuidv4 } from 'uuid'
import { retrieveStagedTransactionParamsSchema } from '../../../schema/transaction.schema.js'
import { retrieveStagedTransaction } from '../../../services/transactions/retrieve-transaction.js'
import transactions from '../transactions.js'

jest.mock('../../../services/transactions/transactions.service.js', () => ({
  createTransaction: jest.fn(async () => mockStagedTransactionRecord()),
  createTransactions: jest.fn(async payloads => Array(payloads.length).fill(mockStagedTransactionRecord())),
  finaliseTransaction: jest.fn(async () => 'FINALISE_TRANSACTION_RESULT'),
  processQueue: jest.fn(async () => {}),
  processDlq: jest.fn(async () => {})
}))

jest.mock('../../../services/transactions/retrieve-transaction.js', () => ({
  retrieveStagedTransaction: jest.fn()
}))

jest.mock('../../../schema/validators/validators.js', () => ({
  ...jest.requireActual('../../../schema/validators/validators.js'),
  createOptionSetValidator: () => async () => undefined,
  createEntityIdValidator: () => async () => undefined,
  createAlternateKeyValidator: () => async () => undefined,
  createReferenceDataEntityValidator: () => async () => undefined,
  createPermitConcessionValidator: () => async () => undefined
}))

jest.mock('@defra-fish/connectors-lib', () => {
  const awsMock = {
    docClient: {
      get: jest.fn(() => ({ Item: { id: 'abc123' } }))
    }
  }
  return {
    AWS: jest.fn(() => awsMock),
    airbrake: {
      initialise: jest.fn()
    }
  }
})

let server = null

describe('transaction handler', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
    expect.extend({
      toBeUnprocessableEntityErrorResponse (received) {
        const payload = JSON.parse(received.payload)
        let pass = true
        pass = pass && received.statusCode === 422
        pass = pass && payload.statusCode === 422
        pass = pass && payload.error === 'Unprocessable Entity'
        pass = pass && payload.message.startsWith('Invalid payload')
        return {
          message: () => 'expected response to be an unprocessable entity error',
          pass: pass
        }
      }
    })
  })
  afterAll(async () => {
    await server.stop()
  })

  describe('postNewTransaction', () => {
    it('calls createTransaction on the transaction service', async () => {
      const transactionPayload = mockTransactionPayload()
      const expectedTransactionRecord = mockStagedTransactionRecord(transactionPayload)
      const result = await server.inject({ method: 'POST', url: '/transactions', payload: transactionPayload })
      expect(result.statusCode).toBe(201)
      expect(JSON.parse(result.payload)).toMatchObject(expectedTransactionRecord)
    })
    it('throws 422 errors if the payload schema fails validation', async () => {
      const result = await server.inject({ method: 'POST', url: '/transactions', payload: {} })
      expect(result).toBeUnprocessableEntityErrorResponse()
    })
  })

  describe('postNewTransactionBatch', () => {
    it('calls createTransactions on the transaction service with up to 25 transactions', async () => {
      const payload = Array(25).fill(mockTransactionPayload())
      const result = await server.inject({ method: 'POST', url: '/transactions/$batch', payload })
      expect(result.statusCode).toBe(200)
      const responsePayload = JSON.parse(result.payload)
      expect(responsePayload).toHaveLength(25)
      expect(responsePayload).toEqual(
        expect.arrayContaining(
          Array(25).fill(
            expect.objectContaining({
              statusCode: 201,
              response: mockStagedTransactionRecord()
            })
          )
        )
      )
    })

    it('returns a 200 response with an array of individual statuses matching the indexes of the request', async () => {
      const payload = [mockTransactionPayload(), { bad: 'payload' }, mockTransactionPayload()]
      const result = await server.inject({ method: 'POST', url: '/transactions/$batch', payload })
      expect(result.statusCode).toBe(200)
      const responsePayload = JSON.parse(result.payload)
      expect(responsePayload).toHaveLength(3)
      expect(responsePayload).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            statusCode: 201,
            response: mockStagedTransactionRecord()
          }),
          expect.objectContaining({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: '"create-transaction-request-permissions" is required'
          }),
          expect.objectContaining({
            statusCode: 201,
            response: mockStagedTransactionRecord()
          })
        ])
      )
    })

    it('returns a 200 response with an array of individual statuses even if all requests are invalid', async () => {
      const payload = [{ bad: 'payload' }, { bad: 'payload' }, { bad: 'payload' }]
      const result = await server.inject({ method: 'POST', url: '/transactions/$batch', payload })
      expect(result.statusCode).toBe(200)
      const responsePayload = JSON.parse(result.payload)
      expect(responsePayload).toHaveLength(3)
      expect(responsePayload).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: '"create-transaction-request-permissions" is required'
          }),
          expect.objectContaining({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: '"create-transaction-request-permissions" is required'
          }),
          expect.objectContaining({
            statusCode: 422,
            error: 'Unprocessable Entity',
            message: '"create-transaction-request-permissions" is required'
          })
        ])
      )
    })

    it('throws 422 errors if the payload contains too many records', async () => {
      const payload = Array(26).fill(mockTransactionPayload())
      const result = await server.inject({ method: 'POST', url: '/transactions/$batch', payload })
      expect(result).toBeUnprocessableEntityErrorResponse()
    })
    it('throws 422 errors if the payload schema fails validation', async () => {
      const result = await server.inject({ method: 'POST', url: '/transactions/$batch', payload: {} })
      expect(result).toBeUnprocessableEntityErrorResponse()
    })
  })

  describe('patchTransaction', () => {
    it('calls finaliseTransaction on the transaction service', async () => {
      const result = await server.inject({
        method: 'PATCH',
        url: `/transactions/${uuidv4()}`,
        payload: {
          payment: {
            amount: 0,
            timestamp: new Date().toISOString(),
            source: 'Gov Pay',
            method: 'Debit card'
          }
        }
      })
      expect(result.statusCode).toBe(200)
      expect(result.payload).toBe('FINALISE_TRANSACTION_RESULT')
    })

    it('accepts the optional channelId field', async () => {
      const result = await server.inject({
        method: 'PATCH',
        url: `/transactions/${uuidv4()}`,
        payload: {
          payment: {
            amount: 0,
            timestamp: new Date().toISOString(),
            channelId: '123456',
            source: 'Gov Pay',
            method: 'Debit card'
          }
        }
      })
      expect(result.statusCode).toBe(200)
      expect(result.payload).toBe('FINALISE_TRANSACTION_RESULT')
    })

    it('throws 422 errors if the payload schema fails validation', async () => {
      const result = await server.inject({ method: 'PATCH', url: `/transactions/${uuidv4()}`, payload: {} })
      expect(result).toBeUnprocessableEntityErrorResponse()
    })
  })

  describe('postToQueue', () => {
    it('calls processQueue on the transaction service', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/process-queue/transactions',
        payload: { id: uuidv4() }
      })
      expect(result.statusCode).toBe(204)
      expect(result.payload).toHaveLength(0)
    })
    it('throws 422 errors if the payload schema fails validation', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/process-queue/transactions',
        payload: {}
      })
      expect(result).toBeUnprocessableEntityErrorResponse()
    })
  })
  describe('postToDlq', () => {
    it('calls processDlq on the transaction service', async () => {
      const result = await server.inject({ method: 'POST', url: '/process-dlq/transactions', payload: { id: uuidv4() } })
      expect(result.statusCode).toBe(204)
      expect(result.payload).toHaveLength(0)
    })
    it('throws 422 errors if the payload schema fails validation', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/process-dlq/transactions',
        payload: {}
      })
      expect(result).toBeUnprocessableEntityErrorResponse()
    })
  })

  describe('retrieveStagedTransaction', () => {
    const getMockRequest = ({ id = 'abc123' }) => ({ params: { id } })
    const getMockResponseToolkit = () => ({ response: jest.fn() })
    const retrieveHandler = transactions[transactions.length - 1].options.handler

    it('handler should return continue response', async () => {
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()
      expect(await retrieveHandler(request, responseToolkit)).toEqual(responseToolkit.continue)
    })

    it('should call retrieveStagedTransaction with id', async () => {
      const id = 'transaction-id'
      const request = getMockRequest({ id })
      await retrieveHandler(request, getMockResponseToolkit())
      expect(retrieveStagedTransaction).toHaveBeenCalledWith(id)
    })

    it('should validate with cancelRecurringPaymentRequestParamsSchema', async () => {
      const id = 'transaction-id'
      const request = getMockRequest({ id })
      await retrieveHandler(request, getMockResponseToolkit())
      expect(transactions[5].options.validate.params).toBe(retrieveStagedTransactionParamsSchema)
    })
  })
})
