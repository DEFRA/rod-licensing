import { finaliseTransaction } from '../finalise-transaction.js'
import { mockTransactionPayload, mockTransactionRecord } from '../../../__mocks__/test-data.js'
const awsMock = require('aws-sdk').default

describe('transaction service', () => {
  beforeEach(awsMock.__resetAll)

  describe('finaliseTransaction', () => {
    it('enqueues a message to sqs', async () => {
      const mockRecord = mockTransactionRecord()
      awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      awsMock.DynamoDB.DocumentClient.__setResponse('update', { Attributes: {} })
      awsMock.SQS.__setResponse('sendMessage', { MessageId: 'Test_Message' })

      process.env.TRANSACTIONS_STAGING_TABLE = 'TestTable'

      const completionFields = {
        payment: {
          amount: 30,
          timestamp: new Date().toISOString(),
          type: 'Gov Pay',
          method: 'Debit card'
        }
      }
      const setFieldExpression = Object.keys(completionFields).map(k => `${k} = :${k}`)
      const expressionAttributeValues = Object.entries(completionFields).reduce((acc, [k, v]) => ({ ...acc, [`:${k}`]: v }), {})
      const result = await finaliseTransaction({ id: mockRecord.id, ...completionFields })
      expect(result).toEqual({ messageId: 'Test_Message', status: 'queued' })
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.update).toBeCalledWith(
        expect.objectContaining({
          TableName: process.env.TRANSACTIONS_STAGING_TABLE,
          Key: { id: mockRecord.id },
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
      awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: undefined })
      try {
        await finaliseTransaction({ id: 'not_found' })
      } catch (e) {
        expect(e.message).toEqual('A transaction for the specified identifier was not found')
        expect(e.output.statusCode).toEqual(404)
      }
    })

    it('throws 402 Payment Required error if the payment amount does not match the cost', async () => {
      const mockRecord = mockTransactionRecord()
      awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      try {
        const payload = {
          payment: {
            amount: 0,
            timestamp: new Date().toISOString(),
            type: 'Gov Pay',
            method: 'Debit card'
          }
        }
        await finaliseTransaction({ id: mockRecord.id, ...payload })
      } catch (e) {
        expect(e.message).toEqual('The payment amount did not match the cost of the transaction')
        expect(e.output.statusCode).toEqual(402)
      }
    })

    it('throws 409 Conflict error if a recurring payment instruction was supplied but the transaciton does not support this', async () => {
      const mockRecord = mockTransactionRecord({ isRecurringPaymentSupported: false })
      awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      try {
        const payload = {
          payment: {
            amount: 30,
            timestamp: new Date().toISOString(),
            type: 'Gov Pay',
            method: 'Debit card',
            recurring: {
              payer: {
                firstName: 'Fester',
                lastName: 'Tester',
                birthDate: '2000-01-01',
                email: 'person@example.com',
                mobilePhone: '+44 7700 900088',
                premises: 'Example House',
                street: 'Example Street',
                locality: 'Near Sample',
                town: 'Exampleton',
                postcode: 'AB12 3CD',
                country: 'GB',
                preferredMethodOfConfirmation: 'Text',
                preferredMethodOfNewsletter: 'Email',
                preferredMethodOfReminder: 'Letter'
              },
              referenceNumber: '1a0921f3-5c54-41ab-9ccd-097511c854f1',
              mandate: 'cb74dd42-6e95-46c5-9531-aa3e510e574f'
            }
          }
        }
        await finaliseTransaction({ id: mockRecord.id, ...payload })
      } catch (e) {
        expect(e.message).toEqual('The transaction does not support recurring payments but an instruction was supplied')
        expect(e.output.statusCode).toEqual(409)
      }
    })

    it('throws exceptions back up the stack', async () => {
      awsMock.DynamoDB.DocumentClient.__throwWithErrorOn('get')
      await expect(finaliseTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })
})
