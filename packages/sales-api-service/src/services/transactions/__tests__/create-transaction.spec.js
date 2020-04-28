import { createTransaction } from '../create-transaction.js'
import {
  mockTransactionPayload,
  mockTransactionRecord,
  MOCK_PERMISSION_NUMBER,
  MOCK_END_DATE,
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_1DAY_SENIOR_PERMIT
} from '../../../__mocks__/test-data.js'
const awsMock = require('aws-sdk').default

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
  beforeEach(awsMock.__resetAll)

  describe('createTransaction', () => {
    it('accepts a new transaction', async () => {
      awsMock.DynamoDB.DocumentClient.__setResponse('put', {})

      const expectedRecord = Object.assign(mockTransactionRecord(), {
        id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
        expires: expect.any(Number),
        cost: 30
      })

      process.env.TRANSACTIONS_STAGING_TABLE = 'TestTable'
      const result = await createTransaction(mockTransactionPayload())
      expect(result).toMatchObject(expectedRecord)
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.put).toBeCalledWith(
        expect.objectContaining({
          TableName: process.env.TRANSACTIONS_STAGING_TABLE,
          Item: expectedRecord
        })
      )
    })

    it('throws exceptions back up the stack', async () => {
      awsMock.DynamoDB.DocumentClient.__throwWithErrorOn('put')
      await expect(createTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })
})
