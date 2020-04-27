import initialiseServer from '../../index.js'
import { mockTransactionPayload, mockTransactionRecord } from '../../../../__mocks__/test-data.js'
jest.mock('../../../services/transactions/transactions.service.js', () => ({
  createTransaction: jest.fn(async () => mockTransactionRecord()),
  finaliseTransaction: jest.fn(async () => 'FINALISE_TRANSACTION_RESULT'),
  processQueue: jest.fn(async () => {}),
  processDlq: jest.fn(async () => {})
}))

jest.mock('../../../schema/validators/index.js', () => ({
  createOptionSetValidator: () => async () => undefined,
  createEntityIdValidator: () => async () => undefined,
  createAlternateKeyValidator: () => async () => undefined,
  createReferenceDataEntityValidator: () => async () => undefined,
  createPermitConcessionValidator: () => async () => undefined
}))

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
      const result = await server.inject({ method: 'POST', url: '/transactions', payload: mockTransactionPayload() })
      expect(result.statusCode).toBe(201)
      expect(JSON.parse(result.payload)).toMatchObject(mockTransactionRecord())
    })
    it('throws 422 errors if the payload schema fails validation', async () => {
      const result = await server.inject({ method: 'POST', url: '/transactions', payload: {} })
      expect(result).toBeUnprocessableEntityErrorResponse()
    })
  })
  describe('patchTransaction', () => {
    it('calls finaliseTransaction on the transaction service', async () => {
      const result = await server.inject({
        method: 'PATCH',
        url: '/transactions/test',
        payload: { paymentSource: 'Gov Pay', paymentMethod: 'Debit card', paymentTimestamp: new Date().toISOString() }
      })
      expect(result.statusCode).toBe(200)
      expect(result.payload).toBe('FINALISE_TRANSACTION_RESULT')
    })
    it('throws 422 errors if the payload schema fails validation', async () => {
      const result = await server.inject({ method: 'PATCH', url: '/transactions/test', payload: {} })
      expect(result).toBeUnprocessableEntityErrorResponse()
    })
  })
  describe('postToQueue', () => {
    it('calls processQueue on the transaction service', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/process-queue/transactions',
        payload: { id: 'test' }
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
      const result = await server.inject({ method: 'POST', url: '/process-dlq/transactions', payload: { id: 'test' } })
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
})
