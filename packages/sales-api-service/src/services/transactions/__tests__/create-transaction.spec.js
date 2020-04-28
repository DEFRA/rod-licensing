import { createTransaction } from '../create-transaction.js'
import { mockTransactionPayload, mockTransactionRecord, MOCK_PERMISSION_NUMBER, MOCK_END_DATE } from '../../../__mocks__/test-data.js'
const awsMock = require('aws-sdk').default

jest.mock('../../permissions.service.js', () => ({
  generatePermissionNumber: () => MOCK_PERMISSION_NUMBER,
  calculateEndDate: () => MOCK_END_DATE
}))

describe('transaction service', () => {
  beforeEach(awsMock.__resetAll)

  describe('createTransaction', () => {
    it('accepts a new transaction', async () => {
      awsMock.DynamoDB.DocumentClient.__setResponse('put', {})

      const expectedRecord = Object.assign(mockTransactionRecord(), {
        id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
        expires: expect.any(Number)
      })

      process.env.TRANSACTIONS_STAGING_TABLE = 'TestTable'
      const result = await createTransaction(mockTransactionPayload())
      expect(result).toMatchObject(expectedRecord)
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.put).toBeCalledWith(
        expect.objectContaining({
          TableName: process.env.TRANSACTIONS_STAGING_TABLE,
          ConditionExpression: 'attribute_not_exists(id)',
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
