import each from 'jest-each'
import { createTransaction, finaliseTransaction, processQueue, processDlq } from '../transactions.service.js'
import {
  ConcessionProof,
  Contact,
  FulfilmentRequest,
  Permission,
  RecurringPayment,
  RecurringPaymentInstruction,
  Transaction,
  TransactionJournal
} from '@defra-fish/dynamics-lib'
import {
  mockTransactionPayload,
  mockTransactionRecord,
  mockCompletedTransactionRecord,
  MOCK_PERMISSION_NUMBER,
  MOCK_END_DATE,
  MOCK_1DAY_SENIOR_PERMIT,
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_CONCESSION,
  MOCK_TRANSACTION_CURRENCY,
  mockContactPayload,
  MOCK_EXISTING_CONTACT_ENTITY
} from '../../../../__mocks__/test-data.js'
const awsMock = require('aws-sdk').default

jest.mock('../../permissions.service.js', () => ({
  generatePermissionNumber: () => MOCK_PERMISSION_NUMBER,
  calculateEndDate: () => MOCK_END_DATE
}))

jest.mock('../../reference-data.service.js', () => ({
  ...jest.requireActual('../../reference-data.service.js'),
  getReferenceDataForEntity: async entityType => {
    if (entityType === MOCK_TRANSACTION_CURRENCY.constructor) {
      return [MOCK_TRANSACTION_CURRENCY]
    }
    return []
  },
  getReferenceDataForEntityAndId: async (entityType, id) => {
    let item = null
    if (entityType === MOCK_12MONTH_SENIOR_PERMIT.constructor) {
      if (id === MOCK_12MONTH_SENIOR_PERMIT.id) {
        item = MOCK_12MONTH_SENIOR_PERMIT
      } else if (id === MOCK_1DAY_SENIOR_PERMIT.id) {
        item = MOCK_1DAY_SENIOR_PERMIT
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

jest.mock('../../contacts.service.js', () => ({
  ...jest.requireActual('../../contacts.service.js'),
  resolveContactPayload: async () => MOCK_EXISTING_CONTACT_ENTITY
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

  describe('processQueue', () => {
    describe('processes messages related to different licence types', () => {
      each([
        [
          'short term licences',
          () => {
            const mockRecord = mockCompletedTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_1DAY_SENIOR_PERMIT.id
            return mockRecord
          },
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(Contact),
            expect.any(Permission),
            expect.any(ConcessionProof)
          ]
        ],
        [
          'long term licences',
          () => {
            const mockRecord = mockCompletedTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_12MONTH_SENIOR_PERMIT.id
            return mockRecord
          },
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(Contact),
            expect.any(Permission),
            expect.any(ConcessionProof),
            expect.any(FulfilmentRequest)
          ]
        ],
        [
          'long term licences (no concession)',
          () => {
            const mockRecord = mockCompletedTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_12MONTH_SENIOR_PERMIT.id
            delete mockRecord.permissions[0].concession
            return mockRecord
          },
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(Contact),
            expect.any(Permission),
            expect.any(FulfilmentRequest)
          ]
        ],
        [
          'licences with a recurring payment',
          () => {
            const mockRecord = mockCompletedTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_12MONTH_SENIOR_PERMIT.id
            mockRecord.recurringPayment = {
              referenceNumber: 'Test Reference Number',
              mandate: 'Test Mandate',
              contact: Object.assign(mockContactPayload(), { firstName: 'Esther' })
            }
            return mockRecord
          },
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(RecurringPayment),
            expect.any(Contact),
            expect.any(Contact),
            expect.any(Permission),
            expect.any(RecurringPaymentInstruction),
            expect.any(ConcessionProof),
            expect.any(FulfilmentRequest)
          ]
        ]
      ]).it('handles %s', async (description, initialiseMockTransactionRecord, entityExpectations) => {
        const mockRecord = initialiseMockTransactionRecord()
        const dynamicsLib = require('@defra-fish/dynamics-lib')

        awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
        awsMock.DynamoDB.DocumentClient.__setResponse('delete', {})
        process.env.TRANSACTIONS_STAGING_TABLE = 'TestTable'
        const result = await processQueue({ id: mockRecord.id })
        expect(result).toBeUndefined()
        expect(dynamicsLib.persist).toBeCalledWith(...entityExpectations)
        expect(awsMock.DynamoDB.DocumentClient.mockedMethods.get).toBeCalledWith(
          expect.objectContaining({
            TableName: process.env.TRANSACTIONS_STAGING_TABLE,
            Key: { id: mockRecord.id },
            ConsistentRead: true
          })
        )
        expect(awsMock.DynamoDB.DocumentClient.mockedMethods.delete).toBeCalledWith(
          expect.objectContaining({
            TableName: process.env.TRANSACTIONS_STAGING_TABLE,
            Key: { id: mockRecord.id }
          })
        )
        const expectedRecord = Object.assign(mockRecord, {
          id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
          expires: expect.any(Number)
        })

        expect(awsMock.DynamoDB.DocumentClient.mockedMethods.put).toBeCalledWith(
          expect.objectContaining({
            TableName: `${process.env.TRANSACTIONS_STAGING_TABLE}History`,
            Item: expectedRecord,
            ConditionExpression: 'attribute_not_exists(id)'
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
        expect(e.message).toEqual('A transaction for the specified identifier was not found')
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
