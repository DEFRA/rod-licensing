import { processQueue } from '../process-transaction-queue.js'
import {
  persist,
  findById,
  ConcessionProof,
  Contact,
  FulfilmentRequest,
  Permission,
  PoclFile,
  RecurringPayment,
  RecurringPaymentInstruction,
  Transaction,
  TransactionJournal
} from '@defra-fish/dynamics-lib'
import {
  mockTransactionRecord,
  mockCompletedTransactionRecord,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_CONCESSION,
  MOCK_TRANSACTION_CURRENCY,
  mockContactPayload,
  MOCK_EXISTING_CONTACT_ENTITY
} from '../../../__mocks__/test-data.js'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_STAGING_HISTORY_TABLE } from '../../../config.js'
import AwsMock from 'aws-sdk'

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
      } else if (id === MOCK_1DAY_SENIOR_PERMIT_ENTITY.id) {
        item = MOCK_1DAY_SENIOR_PERMIT_ENTITY
      }
    } else if (entityType === MOCK_CONCESSION.constructor) {
      item = MOCK_CONCESSION
    }
    return item
  }
}))

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  persist: jest.fn(),
  findById: jest.fn()
}))

jest.mock('../../contacts.service.js', () => ({
  ...jest.requireActual('../../contacts.service.js'),
  resolveContactPayload: async () => MOCK_EXISTING_CONTACT_ENTITY
}))

describe('transaction service', () => {
  beforeAll(() => {
    TRANSACTION_STAGING_TABLE.TableName = 'TestTable'
  })
  beforeEach(AwsMock.__resetAll)

  describe('processQueue', () => {
    describe('processes messages related to different licence types', () => {
      it.each([
        [
          'short term licences',
          () => {
            const mockRecord = mockCompletedTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_1DAY_SENIOR_PERMIT_ENTITY.id
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
            delete mockRecord.permissions[0].concessions
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
            mockRecord.payment.recurring = {
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
      ])('handles %s', async (description, initialiseMockTransactionRecord, entityExpectations) => {
        const mockRecord = initialiseMockTransactionRecord()
        AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
        const result = await processQueue({ id: mockRecord.id })
        expect(result).toBeUndefined()
        expect(persist).toBeCalledWith(...entityExpectations)
        expect(AwsMock.DynamoDB.DocumentClient.mockedMethods.get).toBeCalledWith(
          expect.objectContaining({
            TableName: TRANSACTION_STAGING_TABLE.TableName,
            Key: { id: mockRecord.id },
            ConsistentRead: true
          })
        )
        expect(AwsMock.DynamoDB.DocumentClient.mockedMethods.delete).toBeCalledWith(
          expect.objectContaining({
            TableName: TRANSACTION_STAGING_TABLE.TableName,
            Key: { id: mockRecord.id }
          })
        )
        const expectedRecord = Object.assign(mockRecord, {
          id: expect.stringMatching(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i),
          expires: expect.any(Number)
        })

        expect(AwsMock.DynamoDB.DocumentClient.mockedMethods.put).toBeCalledWith(
          expect.objectContaining({
            TableName: TRANSACTION_STAGING_HISTORY_TABLE.TableName,
            Item: expectedRecord,
            ConditionExpression: 'attribute_not_exists(id)'
          })
        )
      })
    })

    it('handles requests which relate to an transaction file', async () => {
      const transactionFilename = 'test-file.xml'
      const mockRecord = mockCompletedTransactionRecord()
      mockRecord.transactionFile = transactionFilename
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      const transactionToFileBindingSpy = jest.spyOn(Transaction.prototype, 'bindToAlternateKey')
      const permissionToFileBindingSpy = jest.spyOn(Permission.prototype, 'bindToAlternateKey')
      const testPoclFileEntity = new PoclFile()
      findById.mockResolvedValueOnce(testPoclFileEntity)
      await processQueue({ id: mockRecord.id })
      expect(transactionToFileBindingSpy).toHaveBeenCalledWith(Transaction.definition.relationships.poclFile, transactionFilename)
      expect(permissionToFileBindingSpy).toHaveBeenCalledWith(Permission.definition.relationships.poclFile, transactionFilename)
    })

    it('throws 404 not found error if a record cannot be found for the given id', async () => {
      const mockRecord = mockTransactionRecord()
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: undefined })
      try {
        await processQueue({ id: mockRecord.id })
      } catch (e) {
        expect(e.message).toEqual('A transaction for the specified identifier was not found')
        expect(e.output.statusCode).toEqual(404)
      }
    })
  })
})
