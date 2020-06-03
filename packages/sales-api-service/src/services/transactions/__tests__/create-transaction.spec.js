import { createTransaction, createTransactions } from '../create-transaction.js'
import {
  mockTransactionPayload,
  mockTransactionRecord,
  MOCK_PERMISSION_NUMBER,
  MOCK_END_DATE,
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_1DAY_SENIOR_PERMIT
} from '../../../__mocks__/test-data.js'
import { TRANSACTIONS_STAGING_TABLE } from '../../../config.js'
import AwsMock from 'aws-sdk'

jest.mock('../../permissions.service.js', () => ({
  generatePermissionNumber: () => MOCK_PERMISSION_NUMBER,
  calculateEndDate: () => MOCK_END_DATE
}))

jest.mock('../../reference-data.service.js', () => ({
  ...jest.requireActual('../../reference-data.service.js'),
  getReferenceDataForEntityAndId: async (entityType, id) => {
    let item = null
    if (entityType === MOCK_12MONTH_SENIOR_PERMIT.constructor) {
      if (id === MOCK_12MONTH_SENIOR_PERMIT.id) {
        item = MOCK_12MONTH_SENIOR_PERMIT
      } else if (id === MOCK_1DAY_SENIOR_PERMIT.id) {
        item = MOCK_1DAY_SENIOR_PERMIT
      }
    }
    return item
  }
}))

describe('transaction service', () => {
  beforeAll(() => {
    TRANSACTIONS_STAGING_TABLE.TableName = 'TestTable'
  })
  beforeEach(AwsMock.__resetAll)

  describe('createTransaction', () => {
    it('accepts a new transaction', async () => {
      const expectedRecord = Object.assign(mockTransactionRecord(), {
        id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
        expires: expect.any(Number),
        cost: 30,
        isRecurringPaymentSupported: true
      })

      const result = await createTransaction(mockTransactionPayload())
      expect(result).toMatchObject(expectedRecord)
      expect(AwsMock.DynamoDB.DocumentClient.mockedMethods.put).toBeCalledWith(
        expect.objectContaining({
          TableName: TRANSACTIONS_STAGING_TABLE.TableName,
          Item: expectedRecord
        })
      )
    })

    it('throws exceptions back up the stack', async () => {
      AwsMock.DynamoDB.DocumentClient.__throwWithErrorOn('put')
      await expect(createTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })

  describe('createTransactions', () => {
    it('accepts multiple transactions', async () => {
      const expectedRecord = Object.assign(mockTransactionRecord(), {
        id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
        expires: expect.any(Number),
        cost: 30,
        isRecurringPaymentSupported: true
      })

      const result = await createTransactions([mockTransactionPayload(), mockTransactionPayload()])
      expect(result).toEqual(expect.arrayContaining([expectedRecord, expectedRecord]))
      expect(AwsMock.DynamoDB.DocumentClient.mockedMethods.batchWrite).toBeCalledWith(
        expect.objectContaining({
          RequestItems: {
            [TRANSACTIONS_STAGING_TABLE.TableName]: [{ PutRequest: { Item: expectedRecord } }, { PutRequest: { Item: expectedRecord } }]
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
