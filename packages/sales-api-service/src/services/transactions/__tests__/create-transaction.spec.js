import { createTransaction, createTransactions } from '../create-transaction.js'
import {
  mockTransactionPayload,
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_12MONTH_DISABLED_PERMIT
} from '../../../__mocks__/test-data.js'
import { TRANSACTION_STAGING_TABLE } from '../../../config.js'
import AwsMock from 'aws-sdk'
import { getPermissionCost } from '@defra-fish/business-rules-lib'

jest.mock('@defra-fish/business-rules-lib')
jest.mock('../../reference-data.service.js', () => ({
  ...jest.requireActual('../../reference-data.service.js'),
  getReferenceDataForEntityAndId: async (entityType, id) => {
    let item = null
    if (entityType === MOCK_12MONTH_SENIOR_PERMIT.constructor) {
      item = [MOCK_12MONTH_SENIOR_PERMIT, MOCK_12MONTH_DISABLED_PERMIT, MOCK_1DAY_SENIOR_PERMIT_ENTITY].find(p => p.id === id)
    }
    return item
  }
}))

describe('transaction service', () => {
  beforeAll(() => {
    TRANSACTION_STAGING_TABLE.TableName = 'TestTable'
    getPermissionCost.mockReturnValue(54)
  })
  beforeEach(AwsMock.__resetAll)

  describe('createTransaction', () => {
    it('accepts a new transaction', async () => {
      const mockPayload = mockTransactionPayload()
      const expectedResult = Object.assign({}, mockPayload, {
        id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
        expires: expect.any(Number),
        cost: 54,
        isRecurringPaymentSupported: true,
        status: { id: 'STAGED' }
      })

      const result = await createTransaction(mockPayload)
      expect(result).toMatchObject(expectedResult)
      expect(AwsMock.DynamoDB.DocumentClient.mockedMethods.put).toBeCalledWith(
        expect.objectContaining({
          TableName: TRANSACTION_STAGING_TABLE.TableName,
          Item: expectedResult
        })
      )
    })

    it.each([99, 115, 22, 87.99])('uses business rules lib to calculate price (%d)', async permitPrice => {
      getPermissionCost.mockReturnValueOnce(permitPrice)
      const mockPayload = mockTransactionPayload()
      const { cost } = await createTransaction(mockPayload)
      expect(cost).toBe(permitPrice)
    })

    it('passes permission to getPermissionCost', async () => {
      const mockPayload = mockTransactionPayload()
      await createTransaction(mockPayload)
      expect(getPermissionCost).toHaveBeenCalledWith(mockPayload.permissions[0])
    })

    it('throws exceptions back up the stack', async () => {
      AwsMock.DynamoDB.DocumentClient.__throwWithErrorOn('put')
      await expect(createTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })

  describe('createTransactions', () => {
    it('accepts multiple transactions', async () => {
      const mockPayload = mockTransactionPayload()
      const expectedRecord = Object.assign({}, mockPayload, {
        id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
        expires: expect.any(Number),
        cost: 54,
        isRecurringPaymentSupported: true,
        status: { id: 'STAGED' }
      })

      const result = await createTransactions([mockPayload, mockPayload])
      expect(result).toEqual(expect.arrayContaining([expectedRecord, expectedRecord]))
      expect(AwsMock.DynamoDB.DocumentClient.mockedMethods.batchWrite).toBeCalledWith(
        expect.objectContaining({
          RequestItems: {
            [TRANSACTION_STAGING_TABLE.TableName]: [{ PutRequest: { Item: expectedRecord } }, { PutRequest: { Item: expectedRecord } }]
          }
        })
      )
    })

    it('throws exceptions back up the stack', async () => {
      AwsMock.DynamoDB.DocumentClient.__throwWithErrorOn('put')
      await expect(createTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })
})
