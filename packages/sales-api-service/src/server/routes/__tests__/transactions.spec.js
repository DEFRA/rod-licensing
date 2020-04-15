import initialiseServer from '../../index.js'
import { mockTransactionPayload, mockTransactionRecord } from '../../../../__mocks__/test-data.js'
jest.mock('../../../services/transactions.service.js', () => ({
  newTransaction: jest.fn(async () => mockTransactionRecord()),
  completeTransaction: jest.fn(async () => 'COMPLETE_TRANSACTION_RESULT'),
  processQueue: jest.fn(async () => {}),
  processDlq: jest.fn(async () => {})
}))

jest.mock('../../../schema/validators/index.js', () => ({
  createOptionSetValidator: optionSetName => {
    return async value => undefined
  },
  createEntityIdValidator: (entityType, negate = false) => {
    return async value => undefined
  },
  createAlternateKeyValidator: (entityType, alternateKeyProperty, negate = false) => {
    return async value => undefined
  },
  createReferenceDataEntityValidator: entityType => {
    return async value => undefined
  }
}))

let server = null

describe('transaction handler', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })
  afterAll(async () => {
    await server.stop()
  })

  describe('postNewTransaction', () => {
    it('calls newTransaction on the transaction service', async () => {
      const result = await server.inject({ method: 'POST', url: '/transactions', payload: mockTransactionPayload() })
      expect(result.statusCode).toBe(201)
      expect(JSON.parse(result.payload)).toMatchObject(mockTransactionRecord())
    })
  })
  describe('patchTransaction', () => {
    it('calls completeTransaction on the transaction service', async () => {
      const result = await server.inject({ method: 'PATCH', url: '/transactions/test' })
      expect(result.statusCode).toBe(200)
      expect(result.payload).toBe('COMPLETE_TRANSACTION_RESULT')
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
  })
  describe('postToDlq', () => {
    it('calls processDlq on the transaction service', async () => {
      const result = await server.inject({ method: 'POST', url: '/process-dlq/transactions', payload: { id: 'test' } })
      expect(result.statusCode).toBe(204)
      expect(result.payload).toHaveLength(0)
    })
  })
})
