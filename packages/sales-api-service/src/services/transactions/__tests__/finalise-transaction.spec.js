import { finaliseTransaction } from '../finalise-transaction.js'
import { mockTransactionPayload, mockTransactionRecord } from '../../../__mocks__/test-data.js'
const awsMock = require('aws-sdk').default

describe('transaction service', () => {
  beforeEach(awsMock.__resetAll)

  describe('finaliseTransaction', () => {
    it('enqueues a message to sqs', async () => {
      const mockRecord = mockTransactionRecord()
      awsMock.DynamoDB.DocumentClient.__setResponse('update', { Attributes: {} })
      awsMock.SQS.__setResponse('sendMessage', { MessageId: 'Test_Message' })

      process.env.TRANSACTIONS_STAGING_TABLE = 'TestTable'

      const completionFields = {
        paymentTimestamp: new Date().toISOString(),
        paymentType: 'Gov Pay',
        paymentMethod: 'Debit card'
      }
      const setFieldExpression = Object.keys(completionFields)
        .map(k => `${k} = :${k}`)
        .join(', ')
      const expressionAttributeValues = Object.entries(completionFields).reduce((acc, [k, v]) => ({ ...acc, [`:${k}`]: v }), {})

      const result = await finaliseTransaction({ id: mockRecord.id, ...completionFields })
      expect(result).toBe('Test_Message')
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.update).toBeCalledWith(
        expect.objectContaining({
          TableName: process.env.TRANSACTIONS_STAGING_TABLE,
          Key: { id: mockRecord.id },
          ConditionExpression: 'attribute_exists(id)',
          UpdateExpression: `SET ${setFieldExpression}`,
          ExpressionAttributeValues: expect.objectContaining(expressionAttributeValues)
        })
      )
      expect(awsMock.SQS.mockedMethods.sendMessage).toBeCalledWith(
        expect.objectContaining({
          QueueUrl: process.env.TRANSACTIONS_QUEUE_URL,
          MessageGroupId: 'transactions',
          MessageDeduplicationId: mockRecord.id,
          MessageBody: JSON.stringify({ id: mockRecord.id })
        })
      )
    })

    it('throws 404 not found error if a record cannot be found for the given id', async () => {
      awsMock.DynamoDB.DocumentClient.__throwWithErrorOn(
        'update',
        Object.assign(new Error('Test'), { code: 'ConditionalCheckFailedException' })
      )
      try {
        await finaliseTransaction({ id: 'not_found' })
      } catch (e) {
        expect(e.message).toEqual('A transaction for the specified identifier was not found')
        expect(e.output.statusCode).toEqual(404)
      }
    })

    it('throws exceptions back up the stack', async () => {
      awsMock.DynamoDB.DocumentClient.__throwWithErrorOn('update')
      await expect(finaliseTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })
})
