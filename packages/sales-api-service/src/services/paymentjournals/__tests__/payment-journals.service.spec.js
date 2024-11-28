import { PAYMENTS_TABLE } from '../../../config.js'
import { createPaymentJournal, updatePaymentJournal, getPaymentJournal, queryJournalsByTimestamp } from '../payment-journals.service.js'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocument: {
    from: jest.fn().mockReturnValue({
      put: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({ Attributes: { some: 'data' } }),
      get: jest.fn().mockResolvedValue({ Item: { id: 'test-id', some: 'data' } }),
      query: jest.fn().mockResolvedValue({ Items: [] })
    })
  }
}))

jest.mock('../../../../../connectors-lib/src/aws.js', () => ({
  docClient: {
    send: jest.fn()
  }
}))

describe('payment-journals service', () => {
  beforeAll(async () => {
    PAYMENTS_TABLE.TableName = 'TestTable'
  })

  describe('createPaymentJournal', () => {
    it('calls put on dynamodb', async () => {
      await createPaymentJournal('test-id', { some: 'data' })
      expect(DynamoDBDocument.from().put).toHaveBeenCalledWith({
        TableName: PAYMENTS_TABLE.TableName,
        Item: { id: 'test-id', some: 'data', expires: expect.any(Number) },
        ConditionExpression: 'attribute_not_exists(id)'
      })
    })
  })

  describe('updatePaymentJournal', () => {
    it('calls update on dynamodb', async () => {
      await updatePaymentJournal('test-id', { some: 'data' })
      expect(DynamoDBDocument.from().update).toHaveBeenCalledWith({
        TableName: PAYMENTS_TABLE.TableName,
        Key: { id: 'test-id' },
        UpdateExpression: 'SET #expires = :expires, #some = :some',
        ExpressionAttributeNames: {
          '#expires': 'expires',
          '#some': 'some'
        },
        ExpressionAttributeValues: {
          ':expires': expect.any(Number),
          ':some': 'data'
        },
        ConditionExpression: 'attribute_exists(id)',
        ReturnValues: 'ALL_NEW'
      })
    })
  })

  describe('getPaymentJournal', () => {
    it('calls get on dynamodb', async () => {
      await getPaymentJournal('test-id')
      expect(DynamoDBDocument.from().get).toHaveBeenCalledWith({
        TableName: PAYMENTS_TABLE.TableName,
        Key: { id: 'test-id' },
        ConsistentRead: true
      })
    })
  })

  describe('queryJournalsByTimestamp', () => {
    it('calls query on dynamodb', async () => {
      await queryJournalsByTimestamp({ paymentStatus: 'In Progress', from: '2020-05-29T11:44:45.875Z', to: '2020-05-29T11:44:45.875Z' })
      expect(DynamoDBDocument.from().query).toHaveBeenCalledWith({
        TableName: PAYMENTS_TABLE.TableName,
        IndexName: 'PaymentJournalsByStatusAndTimestamp',
        KeyConditionExpression: 'paymentStatus = :paymentStatus AND paymentTimestamp BETWEEN :from AND :to',
        ExpressionAttributeValues: {
          ':from': '2020-05-29T11:44:45.875Z',
          ':paymentStatus': 'In Progress',
          ':to': '2020-05-29T11:44:45.875Z'
        }
      })
    })
  })
})
