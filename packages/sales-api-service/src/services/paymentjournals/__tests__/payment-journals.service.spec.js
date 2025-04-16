import { PAYMENTS_TABLE } from '../../../config.js'
import { createPaymentJournal, updatePaymentJournal, getPaymentJournal, queryJournalsByTimestamp } from '../payment-journals.service.js'
import { AWS } from '@defra-fish/connectors-lib'
const { docClient } = AWS.mock.results[0].value

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    docClient: {
      put: jest.fn(),
      update: jest.fn(() => ({
        Attributes: []
      })),
      get: jest.fn(() => ({ Item: {} })),
      queryAllPromise: jest.fn(),
      createUpdateExpression: jest.fn(() => ({}))
    }
  }))
}))

describe('payment-journals service', () => {
  beforeAll(async () => {
    PAYMENTS_TABLE.TableName = 'TestTable'
  })

  describe('createPaymentJournal', () => {
    it('calls put on dynamodb', async () => {
      await createPaymentJournal('test-id', { some: 'data' })
      expect(docClient.put).toHaveBeenCalledWith({
        TableName: PAYMENTS_TABLE.TableName,
        Item: { id: 'test-id', some: 'data', expires: expect.any(Number) },
        ConditionExpression: 'attribute_not_exists(id)'
      })
    })
  })

  describe('updatePaymentJournal', () => {
    it('calls update on dynamodb', async () => {
      const updateExpression = {
        UpdateExpression: Symbol('update expression')
      }
      docClient.createUpdateExpression.mockReturnValueOnce(updateExpression)
      await updatePaymentJournal('test-id', { some: 'data' })
      expect(docClient.update).toHaveBeenCalledWith({
        // expect(AwsSdk.DynamoDB.DocumentClient.mockedMethods.update).toHaveBeenCalledWith({
        TableName: PAYMENTS_TABLE.TableName,
        Key: { id: 'test-id' },
        ...updateExpression,
        ConditionExpression: 'attribute_exists(id)',
        ReturnValues: 'ALL_NEW'
      })
    })
  })

  describe('getPaymentJournal', () => {
    it('calls get on dynamodb', async () => {
      await getPaymentJournal('test-id')
      expect(docClient.get).toHaveBeenCalledWith({
        TableName: PAYMENTS_TABLE.TableName,
        Key: { id: 'test-id' },
        ConsistentRead: true
      })
    })
  })

  describe('queryJournalsByTimestamp', () => {
    it('calls query on dynamodb', async () => {
      await queryJournalsByTimestamp({ paymentStatus: 'In Progress', from: '2020-05-29T11:44:45.875Z', to: '2020-05-29T11:44:45.875Z' })
      expect(docClient.queryAllPromise).toHaveBeenCalledWith({
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
