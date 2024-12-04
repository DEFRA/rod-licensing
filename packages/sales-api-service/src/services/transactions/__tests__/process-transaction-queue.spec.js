import { processQueue, getTransactionJournalRefNumber } from '../process-transaction-queue.js'
import {
  persist,
  findById,
  ConcessionProof,
  Contact,
  FulfilmentRequest,
  Permission,
  PoclFile,
  RecurringPaymentInstruction,
  Transaction,
  TransactionJournal,
  RecurringPayment
} from '@defra-fish/dynamics-lib'
import {
  mockFinalisedTransactionRecord,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_12MONTH_DISABLED_PERMIT,
  MOCK_CONCESSION,
  MOCK_TRANSACTION_CURRENCY,
  mockContactPayload,
  MOCK_EXISTING_CONTACT_ENTITY
} from '../../../__mocks__/test-data.js'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_STAGING_HISTORY_TABLE } from '../../../config.js'
import AwsMock from 'aws-sdk'
import { POCL_DATA_SOURCE, DDE_DATA_SOURCE } from '@defra-fish/business-rules-lib'
import moment from 'moment'
import { processRecurringPayment, generateRecurringPaymentRecord } from '../../recurring-payments.service.js'

jest.mock('../../reference-data.service.js', () => ({
  ...jest.requireActual('../../reference-data.service.js'),
  getReferenceDataForEntity: async entityType => {
    if (entityType === MOCK_TRANSACTION_CURRENCY.constructor) {
      return [MOCK_TRANSACTION_CURRENCY]
    }
    return []
  },
  getReferenceDataForEntityAndId: jest.fn(async (entityType, id) => {
    let item = null
    if (entityType === MOCK_12MONTH_SENIOR_PERMIT.constructor) {
      item = [MOCK_12MONTH_SENIOR_PERMIT, MOCK_12MONTH_DISABLED_PERMIT, MOCK_1DAY_SENIOR_PERMIT_ENTITY].find(p => p.id === id)
    } else if (entityType === MOCK_CONCESSION.constructor) {
      item = MOCK_CONCESSION
    }
    return item
  })
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

jest.mock('@defra-fish/business-rules-lib', () => ({
  POCL_DATA_SOURCE: 'POCL_DATA_SOURCE',
  DDE_DATA_SOURCE: 'DDE_DATA_SOURCE',
  POCL_TRANSACTION_SOURCES: ['POCL_DATA_SOURCE', 'DDE_DATA_SOURCE'],
  START_AFTER_PAYMENT_MINUTES: 30
}))

jest.mock('../../recurring-payments.service.js')

describe('transaction service', () => {
  beforeAll(() => {
    TRANSACTION_STAGING_TABLE.TableName = 'TestTable'
    processRecurringPayment.mockResolvedValue({})
  })

  beforeEach(jest.clearAllMocks)

  describe('processQueue', () => {
    describe('processes messages related to different licence types', () => {
      it.each([
        [
          'short term licences',
          () => {
            const mockRecord = mockFinalisedTransactionRecord()
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
            const mockRecord = mockFinalisedTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_12MONTH_SENIOR_PERMIT.id
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
          'long term licences (no concession)',
          () => {
            const mockRecord = mockFinalisedTransactionRecord()
            mockRecord.permissions[0].permitId = MOCK_12MONTH_SENIOR_PERMIT.id
            delete mockRecord.permissions[0].concessions
            return mockRecord
          },
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(Contact),
            expect.any(Permission)
          ]
        ],
        [
          'licences with a recurring payment',
          () => {
            processRecurringPayment.mockResolvedValueOnce({ recurringPayment: new RecurringPayment() })
            const mockRecord = mockFinalisedTransactionRecord()
            mockRecord.payment.recurring = {
              name: 'Test name',
              nextDueDate: new Date('2020/01/11'),
              endDate: new Date('2022/01/16'),
              agreementId: '123446jjng',
              publicId: 'sdf-123',
              status: 1,
              activePermission: mockRecord.permissions[0],
              contact: Object.assign(mockContactPayload(), { firstName: 'Esther' })
            }
            mockRecord.permissions[0].permitId = MOCK_12MONTH_SENIOR_PERMIT.id
            return mockRecord
          },
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(RecurringPayment),
            expect.any(Contact),
            expect.any(Permission),
            expect.any(RecurringPaymentInstruction),
            expect.any(ConcessionProof)
          ]
        ]
      ])('handles %s', async (description, initialiseMockTransactionRecord, entityExpectations) => {
        const mockRecord = initialiseMockTransactionRecord()
        AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
        const result = await processQueue({ id: mockRecord.id })
        expect(result).toBeUndefined()
        expect(persist).toBeCalledWith(entityExpectations, undefined)
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

    describe('when the fulfilment change date has not yet passed', () => {
      beforeEach(() => {
        process.env.FULFILMENT_SWITCHOVER_DATE = moment().add(1, 'day').toISOString()
      })

      afterEach(() => {
        delete process.env.FULFILMENT_SWITCHOVER_DATE
      })

      it('includes a FulfilmentRequest when the permit and contact are for postal fulfilment', async () => {
        const mockRecord = mockFinalisedTransactionRecord()
        mockRecord.permissions[0].permitId = MOCK_12MONTH_SENIOR_PERMIT.id
        AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
        await processQueue({ id: mockRecord.id })
        expect(persist).toBeCalledWith(
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(Contact),
            expect.any(Permission),
            expect.any(ConcessionProof),
            expect.any(FulfilmentRequest)
          ],
          undefined
        )
      })

      it('does not include a FulfilmentRequest when the permit and contact are not for postal fulfilment', async () => {
        const mockRecord = mockFinalisedTransactionRecord()
        mockRecord.permissions[0].permitId = MOCK_1DAY_SENIOR_PERMIT_ENTITY.id
        AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
        await processQueue({ id: mockRecord.id })
        expect(persist).toBeCalledWith(
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(Contact),
            expect.any(Permission),
            expect.any(ConcessionProof)
          ],
          undefined
        )
      })
    })

    describe('after the fulfilment change date has passed', () => {
      beforeEach(() => {
        process.env.FULFILMENT_SWITCHOVER_DATE = moment().subtract(1, 'day').toISOString()
      })

      afterEach(() => {
        delete process.env.FULFILMENT_SWITCHOVER_DATE
      })

      it('does not include a FulfilmentRequest when the permit and contact are for postal fulfilment', async () => {
        const mockRecord = mockFinalisedTransactionRecord()
        mockRecord.permissions[0].permitId = MOCK_12MONTH_SENIOR_PERMIT.id
        AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
        await processQueue({ id: mockRecord.id })
        expect(persist).toBeCalledWith(
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(Contact),
            expect.any(Permission),
            expect.any(ConcessionProof)
          ],
          undefined
        )
      })

      it('does not include a FulfilmentRequest when the permit and contact are not for postal fulfilment', async () => {
        const mockRecord = mockFinalisedTransactionRecord()
        mockRecord.permissions[0].permitId = MOCK_1DAY_SENIOR_PERMIT_ENTITY.id
        AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
        await processQueue({ id: mockRecord.id })
        expect(persist).toBeCalledWith(
          [
            expect.any(Transaction),
            expect.any(TransactionJournal),
            expect.any(TransactionJournal),
            expect.any(Contact),
            expect.any(Permission),
            expect.any(ConcessionProof)
          ],
          undefined
        )
      })
    })

    it('sets isLicenceForYou to Yes on the transaction, if it is true on the permission', async () => {
      const mockRecord = mockFinalisedTransactionRecord()
      mockRecord.permissions[0].isLicenceForYou = true
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      await processQueue({ id: mockRecord.id })
      const persistMockFirstAgument = persist.mock.calls[0]
      expect(persistMockFirstAgument[0][4].isLicenceForYou).toBeDefined()
      expect(persistMockFirstAgument[0][4]).toMatchObject({ isLicenceForYou: { id: 1, label: 'Yes', description: 'Yes' } })
    })

    it('sets isLicenceForYou to No on the transaction, if it is false on the permission', async () => {
      const mockRecord = mockFinalisedTransactionRecord()
      mockRecord.permissions[0].isLicenceForYou = false
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      await processQueue({ id: mockRecord.id })
      const persistMockFirstAgument = persist.mock.calls[0]
      expect(persistMockFirstAgument[0][4].isLicenceForYou).toBeDefined()
      expect(persistMockFirstAgument[0][4]).toMatchObject({ isLicenceForYou: { id: 0, label: 'No', description: 'No' } })
    })

    it('does not set isLicenceForYou on the transaction, if it is undefined on the permission', async () => {
      const mockRecord = mockFinalisedTransactionRecord()
      mockRecord.permissions[0].isLicenceForYou = undefined
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      await processQueue({ id: mockRecord.id })
      const persistMockFirstAgument = persist.mock.calls[0]
      expect(persistMockFirstAgument[0][4].isLicenceForYou).toBeUndefined()
    })

    it('does not set isLicenceForYou on the transaction, if it is null on the permission', async () => {
      const mockRecord = mockFinalisedTransactionRecord()
      mockRecord.permissions[0].isLicenceForYou = null
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
      await processQueue({ id: mockRecord.id })
      const persistMockFirstAgument = persist.mock.calls[0]
      expect(persistMockFirstAgument[0][4].isLicenceForYou).toBeUndefined()
    })

    it('handles requests which relate to an transaction file', async () => {
      const transactionFilename = 'test-file.xml'
      const mockRecord = mockFinalisedTransactionRecord()
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
      const mockRecord = mockFinalisedTransactionRecord()
      AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: undefined })
      try {
        await processQueue({ id: mockRecord.id })
      } catch (e) {
        expect(e.message).toEqual('A transaction for the specified identifier was not found')
        expect(e.output.statusCode).toEqual(404)
      }
    })

    describe.each([20, 38.46, 287])('the provisional transaction amount of £%d is used for final transaction amount', cost => {
      const setup = async () => {
        const mockRecord = mockFinalisedTransactionRecord()
        mockRecord.payment.amount = cost
        AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
        await processQueue({ id: mockRecord.id })
        const {
          mock: {
            calls: [[[transaction, chargeJournal, paymentJournal]]]
          }
        } = persist
        return { transaction, chargeJournal, paymentJournal }
      }

      it('for calculating transaction value', async () => {
        const { transaction } = await setup()
        expect(transaction.total).toBe(cost)
      })

      it('for calculating chargeJournal value', async () => {
        const { chargeJournal } = await setup()
        expect(chargeJournal.total).toBe(cost * -1)
      })

      it('for calculating paymentJournal value', async () => {
        const { paymentJournal } = await setup()
        expect(paymentJournal.total).toBe(cost)
      })
    })

    describe('recurring payment processing', () => {
      it('passes transaction record to generateRecurringPaymentRecord', async () => {
        let grprArg
        generateRecurringPaymentRecord.mockImplementationOnce(transaction => {
          grprArg = JSON.parse(JSON.stringify(transaction))
        })
        const mockRecord = mockFinalisedTransactionRecord()
        AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: mockRecord })
        await processQueue({ id: mockRecord.id })
        // jest.fn args aren't immutable and transaction is changed in processQueue, so we use our clone that _is_ immutable
        expect(grprArg).toEqual(mockRecord)
      })

      it('passes return value of generateRecurringPaymentRecord to processRecurringPayment', async () => {
        const rprSymbol = Symbol('rpr')
        const finalisedTransaction = mockFinalisedTransactionRecord()
        generateRecurringPaymentRecord.mockReturnValueOnce(rprSymbol)
        AwsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: finalisedTransaction })
        await processQueue({ id: finalisedTransaction.id })
        expect(processRecurringPayment).toHaveBeenCalledWith(rprSymbol, expect.any(Contact))
      })
    })
  })

  describe('.getTransactionJournalRefNumber', () => {
    describe('when the transaction type is "Payment"', () => {
      it.each([
        ['123456', 2020],
        ['654321', 2021],
        ['567890', 2022]
      ])("and it's a DDE File, and has a journal id, returns journal id", (journalId, year) => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date(year, 1, 1, 10, 0, 0, 0))
        const mockRecord = getSampleRecord({
          dataSource: DDE_DATA_SOURCE,
          journalId
        })
        const refNumber = getTransactionJournalRefNumber(mockRecord, 'Payment')
        expect(refNumber).toBe(`DDE-${year}-${journalId}`)
        jest.useRealTimers()
      })

      it("and it's a POCL file, and has a journal id and a serial number, returns serial number", () => {
        const mockRecord = getSampleRecord()
        mockRecord.journalId = '123456'
        const refNumber = getTransactionJournalRefNumber(mockRecord, 'Payment')
        expect(refNumber).toBe(mockRecord.serialNumber)
      })

      it('and the serial number is present, returns serial number', () => {
        const mockRecord = getSampleRecord()
        const refNumber = getTransactionJournalRefNumber(mockRecord, 'Payment')
        expect(refNumber).toBe(mockRecord.serialNumber)
      })

      it('and the serial number is not present, returns id', () => {
        const mockRecord = getSampleRecord()
        const refNumber = getTransactionJournalRefNumber({ ...mockRecord, serialNumber: null }, 'Payment')
        expect(refNumber).toBe(mockRecord.id)
      })
    })

    describe('when the transaction type is "Charge"', () => {
      it('and the serial number is present, returns id', () => {
        const mockRecord = getSampleRecord()
        const refNumber = getTransactionJournalRefNumber(mockRecord, 'Charge')
        expect(refNumber).toBe(mockRecord.id)
      })

      it('and the serial number is not present, returns id', () => {
        const mockRecord = getSampleRecord()
        const refNumber = getTransactionJournalRefNumber({ ...mockRecord, serialNumber: null }, 'Charge')
        expect(refNumber).toBe(mockRecord.id)
      })
    })

    const getSampleRecord = (overrides = {}) => ({
      ...mockFinalisedTransactionRecord(),
      dataSource: POCL_DATA_SOURCE,
      ...overrides
    })
  })
})
