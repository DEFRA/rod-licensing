import each from 'jest-each'
import { newTransaction, completeTransaction, processQueue, processDlq } from '../transactions.service.js'
import { ConcessionProof, Contact, FulfilmentRequest, Permission } from '@defra-fish/dynamics-lib'
import {
  mockTransactionPayload,
  mockTransactionRecord,
  MOCK_PERMISSION_NUMBER,
  MOCK_END_DATE,
  MOCK_NEW_CONTACT_ENTITY,
  MOCK_1DAY_PERMIT,
  MOCK_12MONTH_PERMIT,
  MOCK_CONCESSION
} from '../../../__mocks__/test-data.js'
const awsMock = require('aws-sdk').default

jest.mock('../permissions.service.js', () => ({
  generatePermissionNumber: () => MOCK_PERMISSION_NUMBER,
  calculateEndDate: () => MOCK_END_DATE
}))

jest.mock('../reference-data.service.js', () => ({
  ...jest.requireActual('../reference-data.service.js'),
  getReferenceDataForId: async (entityType, id) => {
    let item = null
    if (entityType === MOCK_12MONTH_PERMIT.constructor) {
      if (id === 'cb1b34a0-0c66-e611-80dc-c4346bad0190') {
        item = MOCK_12MONTH_PERMIT
      } else if (id === '9f1b34a0-0c66-e611-80dc-c4346bad0190') {
        item = MOCK_1DAY_PERMIT
      }
    } else if (entityType === MOCK_CONCESSION.constructor) {
      item = MOCK_CONCESSION
    }
    return item
  }
}))

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  persist: jest.fn()
}))

jest.mock('../contacts.service.js', () => ({
  ...jest.requireActual('../contacts.service.js'),
  resolveContactPayload: async () => MOCK_NEW_CONTACT_ENTITY
}))

describe('transaction service', () => {
  beforeEach(awsMock.__resetAll)

  describe('newTransaction', () => {
    it('accepts a new transaction', async () => {
      awsMock.DynamoDB.DocumentClient.__setResponse('put', {})

      const expectedRecord = Object.assign(mockTransactionRecord(), {
        id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
        expires: expect.any(Number)
      })

      process.env.TRANSACTIONS_STAGING_TABLE = 'TestTable'
      const result = await newTransaction(mockTransactionPayload())
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
      await expect(newTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })

  describe('completeTransaction', () => {
    it('enqueues a message to sqs', async () => {
      const mockRecord = mockTransactionRecord()
      awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      awsMock.SQS.__setResponse('sendMessage', { MessageId: 'Test_Message' })

      process.env.TRANSACTIONS_STAGING_TABLE = 'TestTable'
      const result = await completeTransaction({ id: mockRecord.id })
      expect(result).toBe('Test_Message')
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.get).toBeCalledWith(
        expect.objectContaining({
          TableName: process.env.TRANSACTIONS_STAGING_TABLE,
          Key: { id: mockRecord.id },
          ConsistentRead: true
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
        await completeTransaction(mockTransactionPayload())
      } catch (e) {
        expect(e.message).toEqual('A transaction for the provided identifier could not be found')
        expect(e.output.statusCode).toEqual(404)
      }
    })

    it('throws exceptions back up the stack', async () => {
      awsMock.DynamoDB.DocumentClient.__throwWithErrorOn('get')
      await expect(completeTransaction(mockTransactionPayload())).rejects.toThrow('Test error')
    })
  })

  describe('processQueue', () => {
    describe('processes messages related to different licence types', () => {
      each([
        [
          'short term licences',
          () => {
            const mockRecord = mockTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_1DAY_PERMIT.id
            return mockRecord
          },
          [expect.any(Contact), expect.any(Permission), expect.any(ConcessionProof)]
        ],
        [
          'long term licences',
          () => {
            const mockRecord = mockTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_12MONTH_PERMIT.id
            return mockRecord
          },
          [expect.any(Contact), expect.any(Permission), expect.any(ConcessionProof), expect.any(FulfilmentRequest)]
        ],
        [
          'long term licences (no concession)',
          () => {
            const mockRecord = mockTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_12MONTH_PERMIT.id
            delete mockRecord.permissions[0].concession
            return mockRecord
          },
          [expect.any(Contact), expect.any(Permission), expect.any(ConcessionProof), expect.any(FulfilmentRequest)]
        ]
      ]).it('handles %s', async (description, initialiseMockTransactionRecord, entityExpectations) => {
        const mockTransactionRecord = initialiseMockTransactionRecord()
        const dynamicsLib = require('@defra-fish/dynamics-lib')

        awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockTransactionRecord })
        awsMock.DynamoDB.DocumentClient.__setResponse('delete', {})
        process.env.TRANSACTIONS_STAGING_TABLE = 'TestTable'
        const result = await processQueue({ id: mockTransactionRecord.id })
        expect(result).toBeUndefined()
        expect(dynamicsLib.persist).toBeCalledWith(...entityExpectations)
        expect(awsMock.DynamoDB.DocumentClient.mockedMethods.get).toBeCalledWith(
          expect.objectContaining({
            TableName: process.env.TRANSACTIONS_STAGING_TABLE,
            Key: { id: mockTransactionRecord.id },
            ConsistentRead: true
          })
        )
        expect(awsMock.DynamoDB.DocumentClient.mockedMethods.delete).toBeCalledWith(
          expect.objectContaining({
            TableName: process.env.TRANSACTIONS_STAGING_TABLE,
            Key: { id: mockTransactionRecord.id }
          })
        )
      })
    })

    it('throws 404 not found error if a record cannot be found for the given id', async () => {
      const mockRecord = mockTransactionRecord()
      awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: undefined })
      try {
        await processQueue({ id: mockRecord.id })
      } catch (e) {
        expect(e.message).toEqual('A transaction for the provided identifier could not be found')
        expect(e.output.statusCode).toEqual(404)
      }
    })
  })

  describe('processDlq', () => {
    it('processes staging exceptions', async () => {
      // TODO: Implement DLQ handling
      await processDlq({ id: mockTransactionRecord.id })
    })
  })
})
