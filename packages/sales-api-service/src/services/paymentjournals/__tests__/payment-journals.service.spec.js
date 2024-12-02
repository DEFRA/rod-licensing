import { PAYMENTS_TABLE } from '../../../config.js'
import { createPaymentJournal, updatePaymentJournal, getPaymentJournal, queryJournalsByTimestamp } from '../payment-journals.service.js'
import { docClient } from '../../../../../connectors-lib/src/aws.js'
import { PutCommand, UpdateCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

jest.mock('../../../../../connectors-lib/src/aws.js', () => ({
  docClient: {
    send: jest.fn(),
    createUpdateExpression: jest.fn(payload =>
      Object.entries(payload).reduce(
        (acc, [k, v], idx) => {
          acc.UpdateExpression += `${idx > 0 ? ',' : ''}#${k} = :${k}`
          acc.ExpressionAttributeNames[`#${k}`] = k
          acc.ExpressionAttributeValues[`:${k}`] = v
          return acc
        },
        { UpdateExpression: 'SET ', ExpressionAttributeNames: {}, ExpressionAttributeValues: {} }
      )
    )
  }
}))

describe('payment-journals service', () => {
  beforeAll(async () => {
    PAYMENTS_TABLE.TableName = 'TestTable'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPaymentJournal', () => {
    it('calls put (PutCommand) on dynamodb', async () => {
      const expectedInput = {
        TableName: PAYMENTS_TABLE.TableName,
        Item: { id: 'test-id', some: 'data', expires: expect.any(Number) },
        ConditionExpression: 'attribute_not_exists(id)'
      }
      const mockSend = docClient.send
      mockSend.mockResolvedValueOnce({})
      await createPaymentJournal('test-id', { some: 'data' })
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand))
      const calledCommand = mockSend.mock.calls[0][0]
      expect(calledCommand.input).toEqual(expectedInput)
    })
  })

  describe('updatePaymentJournal', () => {
    it('calls update (UpdateCommand) on dynamodb', async () => {
      const expectedInput = {
        TableName: PAYMENTS_TABLE.TableName,
        Key: { id: 'test-id' },
        UpdateExpression: 'SET #expires = :expires,#some = :some',
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
      }
      const mockSend = docClient.send
      mockSend.mockResolvedValueOnce({ Attributes: { id: 'test-id', some: 'data', expires: 1234567890 } })
      await updatePaymentJournal('test-id', { some: 'data' })
      expect(mockSend).toHaveBeenCalledWith(expect.any(UpdateCommand))
      const calledCommand = mockSend.mock.calls[0][0]
      expect(calledCommand.input).toEqual(expectedInput)
    })
  })

  describe('getPaymentJournal', () => {
    it('calls get (GetCommand) on dynamodb', async () => {
      const expectedInput = {
        TableName: PAYMENTS_TABLE.TableName,
        Key: { id: 'test-id' },
        ConsistentRead: true
      }
      const mockSend = docClient.send
      mockSend.mockResolvedValueOnce({ Item: { id: 'test-id', some: 'data', expires: 1234567890 } })
      await getPaymentJournal('test-id')
      expect(mockSend).toHaveBeenCalledWith(expect.any(GetCommand))
      const calledCommand = mockSend.mock.calls[0][0]
      expect(calledCommand.input).toEqual(expectedInput)
    })
  })

  describe('queryJournalsByTimestamp', () => {
    it('calls query (QueryCommand) on dynamodb', async () => {
      const params = { paymentStatus: 'In Progress', from: '2020-05-29T11:44:45.875Z', to: '2020-05-29T11:44:45.875Z' }
      const expectedInput = {
        TableName: PAYMENTS_TABLE.TableName,
        IndexName: 'PaymentJournalsByStatusAndTimestamp',
        KeyConditionExpression: 'paymentStatus = :paymentStatus AND paymentTimestamp BETWEEN :from AND :to',
        ExpressionAttributeValues: {
          ':paymentStatus': 'In Progress',
          ':from': '2020-05-29T11:44:45.875Z',
          ':to': '2020-05-29T11:44:45.875Z'
        }
      }
      const mockSend = docClient.send
      mockSend.mockResolvedValueOnce({ Items: [{ id: 'test-id', some: 'data', expires: 1234567890 }] })
      await queryJournalsByTimestamp(params)
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand))
      const calledCommand = mockSend.mock.calls[0][0]
      expect(calledCommand.input).toEqual(expectedInput)
    })
  })
})
