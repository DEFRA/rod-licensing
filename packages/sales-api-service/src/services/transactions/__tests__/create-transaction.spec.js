import { createTransaction, createTransactions } from '../create-transaction.js'
import {
  mockTransactionPayload,
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_12MONTH_DISABLED_PERMIT
} from '../../../__mocks__/test-data.js'
import { TRANSACTION_STAGING_TABLE } from '../../../config.js'
import { getPermissionCost } from '@defra-fish/business-rules-lib'
import { getReferenceDataForEntityAndId } from '../../reference-data.service.js'
import { AWS } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/business-rules-lib')
jest.mock('../../reference-data.service.js', () => ({
  ...jest.requireActual('../../reference-data.service.js'),
  getReferenceDataForEntityAndId: jest.fn(async (entityType, id) => {
    let item = null
    if (entityType === MOCK_12MONTH_SENIOR_PERMIT.constructor) {
      item = [MOCK_12MONTH_SENIOR_PERMIT, MOCK_12MONTH_DISABLED_PERMIT, MOCK_1DAY_SENIOR_PERMIT_ENTITY].find(p => p.id === id)
    }
    return item
  })
}))

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    docClient: {
      send: jest.fn()
    }
  }))
}))

const { docClient } = AWS.mock.results[0].value

describe('transaction service', () => {
  beforeAll(() => {
    TRANSACTION_STAGING_TABLE.TableName = 'TestTable'
    getPermissionCost.mockReturnValue(54)
  })
  beforeEach(jest.clearAllMocks)

  describe('createTransaction', () => {
    it('accepts a new transaction', async () => {
      const mockPayload = mockTransactionPayload()
      const expectedResult = {
        ...mockPayload,
        id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
        expires: expect.any(Number),
        cost: 54,
        isRecurringPaymentSupported: true,
        status: { id: 'STAGED' }
      }

      const result = await createTransaction(mockPayload)
      expect(result).toEqual(expectedResult)
      const calledCommandInstance = docClient.send.mock.calls[0][0]
      expect(calledCommandInstance.input).toEqual({
        TableName: TRANSACTION_STAGING_TABLE.TableName,
        Item: expectedResult,
        ConditionExpression: 'attribute_not_exists(id)'
      })
    })

    it.each([99, 115, 22, 87.99])('uses business rules lib to calculate price (%d)', async permitPrice => {
      getPermissionCost.mockReturnValueOnce(permitPrice)
      const mockPayload = mockTransactionPayload()
      const { cost } = await createTransaction(mockPayload)
      expect(cost).toBe(permitPrice)
    })

    it('passes startDate and permit to getPermissionCost', async () => {
      getReferenceDataForEntityAndId.mockReturnValueOnce(MOCK_12MONTH_SENIOR_PERMIT)
      const mockPayload = mockTransactionPayload()
      const {
        permissions: [{ startDate }]
      } = mockPayload
      await createTransaction(mockPayload)
      expect(getPermissionCost).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          permit: MOCK_12MONTH_SENIOR_PERMIT
        })
      )
    })

    it('throws exceptions back up the stack', async () => {
      docClient.send.mockRejectedValueOnce(new Error('Test error'))
      await expect(createTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })

    it('uses transaction id if supplied in payload', async () => {
      const mockPayload = mockTransactionPayload()
      mockPayload.transactionId = 'abc-123-def-456'
      const result = await createTransaction(mockPayload)
      expect(result.id).toBe(mockPayload.transactionId)
    })
  })

  describe('createTransactions', () => {
    it('accepts multiple transactions', async () => {
      const mockPayload = mockTransactionPayload()
      const expectedRecord = {
        ...mockPayload,
        id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
        expires: expect.any(Number),
        cost: 54,
        isRecurringPaymentSupported: true,
        status: { id: 'STAGED' }
      }

      await createTransactions([mockPayload, mockPayload])
      const calledCommandInstance = docClient.send.mock.calls[0][0]
      expect(calledCommandInstance.input).toEqual({
        RequestItems: {
          [TRANSACTION_STAGING_TABLE.TableName]: [{ PutRequest: { Item: expectedRecord } }, { PutRequest: { Item: expectedRecord } }]
        }
      })
    })

    it('throws exceptions back up the stack', async () => {
      docClient.send.mockRejectedValueOnce(new Error('Test error'))
      await expect(createTransactions([mockTransactionPayload()])).rejects.toThrow('Test error')
    })
  })
})
