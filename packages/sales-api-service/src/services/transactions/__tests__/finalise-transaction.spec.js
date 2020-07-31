import { finaliseTransaction } from '../finalise-transaction.js'
import { mockTransactionPayload, mockTransactionRecord } from '../../../__mocks__/test-data.js'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_QUEUE } from '../../../config.js'
import AwsMock from 'aws-sdk'

describe('transaction service', () => {
  beforeAll(() => {
    TRANSACTION_STAGING_TABLE.TableName = 'TestTable'
    TRANSACTION_QUEUE.Url = 'TestQueueUrl'
  })
  beforeEach(AwsMock.__resetAll)

  describe('finaliseTransaction', () => {
    it('enqueues a message to sqs', async () => {
      const mockRecord = mockTransactionRecord()
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      AwsMock.DynamoDB.DocumentClient.__setResponse('update', { Attributes: {} })
      AwsMock.SQS.__setResponse('sendMessage', { MessageId: 'Test_Message' })

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
      expect(AwsMock.DynamoDB.DocumentClient.mockedMethods.update).toBeCalledWith(
        expect.objectContaining({
          TableName: TRANSACTION_STAGING_TABLE.TableName,
          Key: { id: mockRecord.id },
          UpdateExpression: `SET ${setFieldExpression}`,
          ExpressionAttributeValues: expect.objectContaining(expressionAttributeValues)
        })
      )
      expect(AwsMock.SQS.mockedMethods.sendMessage).toBeCalledWith(
        expect.objectContaining({
          QueueUrl: TRANSACTION_QUEUE.Url,
          MessageGroupId: mockRecord.id,
          MessageDeduplicationId: mockRecord.id,
          MessageBody: JSON.stringify({ id: mockRecord.id })
        })
      )
    })

    it('throws 404 not found error if a record cannot be found for the given id', async () => {
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: undefined })
      try {
        await finaliseTransaction({ id: 'not_found' })
      } catch (e) {
        expect(e.message).toEqual('A transaction for the specified identifier was not found')
        expect(e.output.statusCode).toEqual(404)
      }
    })

    it('throws 402 Payment Required error if the payment amount does not match the cost', async () => {
      const mockRecord = mockTransactionRecord()
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
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
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
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
      AwsMock.DynamoDB.DocumentClient.__throwWithErrorOn('get')
      await expect(finaliseTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })
})
