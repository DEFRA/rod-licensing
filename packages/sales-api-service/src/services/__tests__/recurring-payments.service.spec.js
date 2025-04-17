import { findDueRecurringPayments, Permission } from '@defra-fish/dynamics-lib'
import {
  getRecurringPayments,
  processRecurringPayment,
  generateRecurringPaymentRecord,
  processRPResult
} from '../recurring-payments.service.js'
import { calculateEndDate, generatePermissionNumber } from '../permissions.service.js'
import { getObfuscatedDob } from '../contacts.service.js'
import { createHash } from 'node:crypto'
import { AWS } from '@defra-fish/connectors-lib'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_QUEUE } from '../../config.js'
import { TRANSACTION_STATUS } from '../../services/transactions/constants.js'
import { retrieveStagedTransaction } from '../../services/transactions/retrieve-transaction.js'
import { createPaymentJournal, getPaymentJournal, updatePaymentJournal } from '../../services/paymentjournals/payment-journals.service.js'
import { PAYMENT_JOURNAL_STATUS_CODES, TRANSACTION_SOURCE, PAYMENT_TYPE } from '@defra-fish/business-rules-lib'
const { docClient, sqs } = AWS.mock.results[0].value

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  executeQuery: jest.fn(),
  findById: jest.fn(),
  findDueRecurringPayments: jest.fn()
}))

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    docClient: {
      update: jest.fn(),
      createUpdateExpression: jest.fn()
    },
    sqs: {
      sendMessage: jest.fn()
    }
  }))
}))

jest.mock('node:crypto', () => ({
  createHash: jest.fn(() => ({
    update: () => {},
    digest: () => 'abcdef99987'
  }))
}))

jest.mock('../contacts.service.js', () => ({
  getObfuscatedDob: jest.fn()
}))

jest.mock('../permissions.service.js', () => ({
  calculateEndDate: jest.fn(),
  generatePermissionNumber: jest.fn()
}))

jest.mock('../../services/transactions/retrieve-transaction.js', () => ({
  retrieveStagedTransaction: jest.fn()
}))

jest.mock('../../services/paymentjournals/payment-journals.service.js', () => ({
  createPaymentJournal: jest.fn(),
  getPaymentJournal: jest.fn(),
  updatePaymentJournal: jest.fn()
}))

jest.mock('@defra-fish/business-rules-lib', () => ({
  ADVANCED_PURCHASE_MAX_DAYS: 30,
  PAYMENT_JOURNAL_STATUS_CODES: {
    InProgress: 'InProgressCode',
    Cancelled: 'CancelledCode',
    Failed: 'FailedCode',
    Expired: 'ExpiredCode',
    Completed: 'CompletedCode'
  },
  TRANSACTION_SOURCE: {
    govPay: Symbol('govpay')
  },
  PAYMENT_TYPE: {
    debit: Symbol('debit')
  }
}))

const dynamicsLib = jest.requireMock('@defra-fish/dynamics-lib')

const getMockRecurringPayment = () => ({
  name: 'Test Name',
  nextDueDate: '2019-12-14T00:00:00Z',
  cancelledDate: null,
  cancelledReason: null,
  endDate: '2019-12-15T00:00:00Z',
  agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472',
  publicId: '649-213',
  status: 1,
  expanded: {
    contact: {
      entity: getMockContact()
    },
    activePermission: {
      entity: getMockPermission()
    }
  }
})

const getMockRPContactPermission = (contact, permission) => ({
  name: 'Test Name',
  nextDueDate: '2019-12-14T00:00:00Z',
  cancelledDate: null,
  cancelledReason: null,
  endDate: '2019-12-15T00:00:00Z',
  agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472',
  publicId: '649-213',
  status: 1,
  expanded: {
    contact,
    activePermission: permission
  }
})

const getMockContact = () => ({
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
  country: 'GB-ENG',
  preferredMethodOfConfirmation: 'Text',
  preferredMethodOfNewsletter: 'Email',
  preferredMethodOfReminder: 'Letter',
  postalFulfilment: true
})

const getMockPermission = () => ({
  referenceNumber: '12345678',
  licenceLength: '12M',
  isLicenceForYou: true,
  licensee: {
    firstName: 'Fester',
    lastName: 'Tester',
    premises: '14 Howecroft Court',
    street: 'Eastmead Lane',
    town: 'Bristol',
    postcode: 'BS9 1HJ',
    email: 'fester@tester.com',
    mobilePhone: '01234567890',
    birthDate: '1996-01-01',
    postalFulfilment: true
  }
})

const getMockTransaction = (id = 'test-id') => ({
  id,
  dataSource: 'RCP',
  permissions: [
    {
      issueDate: new Date('2024-01-01'),
      startDate: new Date('2024-01-01'),
      licensee: {
        firstName: 'Test',
        lastName: 'User'
      }
    }
  ]
})

describe('recurring payments service', () => {
  const createSimpleSampleTransactionRecord = () => ({ payment: { recurring: true }, permissions: [{}] })
  const createSamplePermission = overrides => {
    const p = new Permission()
    p.referenceNumber = 'ABC123'
    p.issueDate = '2024-12-04T11:15:12Z'
    p.startDate = '2024-12-04T11:45:12Z'
    p.endDate = '2025-12-03T23:59:59.999Z'
    p.stagingId = 'aaa-111-bbb-222'
    p.isRenewal = false
    p.isLicenseForYou = 1
    for (const key in overrides) {
      p[key] = overrides[key]
    }
    return p
  }

  beforeEach(jest.clearAllMocks)
  beforeAll(() => {
    TRANSACTION_QUEUE.Url = 'TestUrl'
    TRANSACTION_STAGING_TABLE.TableName = 'TestTable'
  })

  describe('getRecurringPayments', () => {
    it('should equal result of findDueRecurringPayments query', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const mockContact = mockRecurringPayments[0].expanded.contact
      const mockPermission = mockRecurringPayments[0].expanded.activePermission

      dynamicsLib.executeQuery.mockResolvedValueOnce(mockRecurringPayments)

      const result = await getRecurringPayments(new Date())

      expect(result).toEqual([getMockRPContactPermission(mockContact, mockPermission)])
    })

    it('executeQuery is called with findDueRecurringPayments with a date', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const mockDate = new Date()
      dynamicsLib.executeQuery.mockResolvedValueOnce(mockRecurringPayments)

      await getRecurringPayments(mockDate)

      expect(dynamicsLib.executeQuery).toHaveBeenCalledWith(findDueRecurringPayments(mockDate))
    })
  })

  describe('processRecurringPayment', () => {
    it('should return null when transactionRecord.payment.recurring is not present', async () => {
      const transactionRecord = { payment: null }
      const result = await processRecurringPayment(transactionRecord, getMockContact())
      expect(result.recurringPayment).toBeNull()
    })

    it('should return a valid recurringPayment when transactionRecord.payment.recurring is present', async () => {
      const transactionRecord = {
        payment: {
          recurring: {
            name: 'Test Name',
            nextDueDate: new Date('2023-11-02'),
            cancelledDate: null,
            cancelledReason: null,
            endDate: new Date('2023-11-12'),
            agreementId: '435678',
            status: 0
          }
        },
        permissions: [getMockPermission()]
      }
      const contact = getMockContact()
      const result = await processRecurringPayment(transactionRecord, contact)
      expect(result.recurringPayment).toMatchSnapshot()
    })

    it.each(['abc-123', 'def-987'])('generates a publicId %s for the recurring payment', async samplePublicId => {
      createHash.mockReturnValue({
        update: () => {},
        digest: () => samplePublicId
      })
      const result = await processRecurringPayment(createSimpleSampleTransactionRecord(), getMockContact())
      expect(result.recurringPayment.publicId).toBe(samplePublicId)
    })

    it('passes the unique id of the entity to the hash.update function', async () => {
      const update = jest.fn()
      createHash.mockReturnValueOnce({
        update,
        digest: () => {}
      })
      const { recurringPayment } = await processRecurringPayment(createSimpleSampleTransactionRecord(), getMockContact())
      expect(update).toHaveBeenCalledWith(recurringPayment.uniqueContentId)
    })

    it('hashes using sha256', async () => {
      await processRecurringPayment(createSimpleSampleTransactionRecord(), getMockContact())
      expect(createHash).toHaveBeenCalledWith('sha256')
    })

    it('uses base64 hash string', async () => {
      const digest = jest.fn()
      createHash.mockReturnValueOnce({
        update: () => {},
        digest
      })
      await processRecurringPayment(createSimpleSampleTransactionRecord(), getMockContact())
      expect(digest).toHaveBeenCalledWith('base64')
    })
  })

  describe('generateRecurringPaymentRecord', () => {
    const createFinalisedSampleTransaction = (agreementId, permission) => ({
      expires: 1732892402,
      cost: 35.8,
      isRecurringPaymentSupported: true,
      permissions: [
        {
          permitId: 'permit-id-1',
          licensee: {},
          referenceNumber: '23211125-2WC3FBP-ABNDT8',
          isLicenceForYou: true,
          ...permission
        }
      ],
      agreementId,
      payment: {
        amount: 35.8,
        source: 'Gov Pay',
        method: 'Debit card',
        timestamp: '2024-11-22T15:00:45.922Z'
      },
      id: 'd26d646f-ed0f-4cf1-b6c1-ccfbbd611757',
      dataSource: 'Web Sales',
      transactionId: 'd26d646f-ed0f-4cf1-b6c1-ccfbbd611757',
      status: { id: 'FINALISED' }
    })

    it.each([
      [
        'same day start - next due on issue date plus one year minus ten days',
        'iujhy7u8ijhy7u8iuuiuu8ie89',
        {
          startDate: '2024-11-22T15:30:45.922Z',
          issueDate: '2024-11-22T15:00:45.922Z',
          endDate: '2025-11-21T23:59:59.999Z'
        },
        '2025-11-12T00:00:00.000Z'
      ],
      [
        'next day start - next due on end date minus ten days',
        '89iujhy7u8i87yu9iokjuij901',
        {
          startDate: '2024-11-23T00:00:00.000Z',
          issueDate: '2024-11-22T15:00:45.922Z',
          endDate: '2025-11-22T23:59:59.999Z'
        },
        '2025-11-12T00:00:00.000Z'
      ],
      [
        'starts ten days after issue - next due on issue date plus one year',
        '9o8u7yhui89u8i9oiu8i8u7yhu',
        {
          startDate: '2024-11-22T00:00:00.000Z',
          issueDate: '2024-11-12T15:00:45.922Z',
          endDate: '2025-11-21T23:59:59.999Z'
        },
        '2025-11-12T00:00:00.000Z'
      ],
      [
        'starts twenty days after issue - next due on issue date plus one year',
        '9o8u7yhui89u8i9oiu8i8u7yhu',
        {
          startDate: '2024-12-01T00:00:00.000Z',
          issueDate: '2024-11-12T15:00:45.922Z',
          endDate: '2025-01-30T23:59:59.999Z'
        },
        '2025-11-12T00:00:00.000Z'
      ],
      [
        "issued on 29th Feb '24, starts on 30th March '24 - next due on 28th Feb '25",
        'hy7u8ijhyu78jhyu8iu8hjiujn',
        {
          startDate: '2024-03-30T00:00:00.000Z',
          issueDate: '2024-02-29T12:38:24.123Z',
          endDate: '2025-03-29T23:59:59.999Z'
        },
        '2025-02-28T00:00:00.000Z'
      ],
      [
        "issued on 30th March '25 at 1am, starts at 1:30am - next due on 20th March '26",
        'jhy67uijhy67u87yhtgjui8u7j',
        {
          startDate: '2025-03-30T01:30:00.000Z',
          issueDate: '2025-03-30T01:00:00.000Z',
          endDate: '2026-03-29T23:59:59.999Z'
        },
        '2026-03-20T00:00:00.000Z'
      ]
    ])('creates record from transaction with %s', (_d, agreementId, permissionData, expectedNextDueDate) => {
      const sampleTransaction = createFinalisedSampleTransaction(agreementId, permissionData)
      const permission = createSamplePermission(permissionData)

      const rpRecord = generateRecurringPaymentRecord(sampleTransaction, permission)

      expect(rpRecord).toEqual(
        expect.objectContaining({
          payment: expect.objectContaining({
            recurring: expect.objectContaining({
              name: '',
              nextDueDate: expectedNextDueDate,
              cancelledDate: null,
              cancelledReason: null,
              endDate: permissionData.endDate,
              agreementId,
              status: 1
            })
          }),
          permissions: expect.arrayContaining([permission])
        })
      )
    })

    it.each([
      [
        'start date is thirty one days after issue date',
        {
          startDate: '2024-12-14T00:00:00.000Z',
          issueDate: '2024-11-12T15:00:45.922Z',
          endDate: '2025-12-13T23:59:59.999Z'
        }
      ],
      [
        'start date precedes issue date',
        {
          startDate: '2024-11-11T00:00:00.000Z',
          issueDate: '2024-11-12T15:00:45.922Z',
          endDate: '2025-11-10T23:59:59.999Z'
        }
      ]
    ])('throws an error for invalid dates when %s', (_d, permission) => {
      const sampleTransaction = createFinalisedSampleTransaction('hyu78ijhyu78ijuhyu78ij9iu6', permission)

      expect(() => generateRecurringPaymentRecord(sampleTransaction)).toThrow('Invalid dates provided for permission')
    })

    it('returns a false flag when agreementId is not present', () => {
      const sampleTransaction = createFinalisedSampleTransaction(null, {
        startDate: '2024-11-22T15:30:45.922Z',
        issueDate: '2024-11-22T15:00:45.922Z',
        endDate: '2025-11-21T23:59:59.999Z'
      })

      const rpRecord = generateRecurringPaymentRecord(sampleTransaction)

      expect(rpRecord.payment.recurring).toBeFalsy()
    })
  })

  describe.each(['abc-123', 'hyt678iuhy78uijhgtrfg', 'jhu7i8u7yh-jhu78u'])('processRPResult with transaction id %s', transactionId => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2024-03-12T09:57:23.745Z'))
    })
    afterEach(() => {
      jest.useRealTimers()
    })
    it('should call retrieveStagedTransaction with transaction id', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)
      await processRPResult(transactionId, '123', '2025-01-01')

      expect(retrieveStagedTransaction).toHaveBeenCalledWith(transactionId)
    })

    it('should call await getPaymentJournal with transaction id', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)
      await processRPResult(mockTransaction.id, '123', '2025-01-01')

      expect(retrieveStagedTransaction).toHaveBeenCalledWith(mockTransaction.id)
    })

    it('if getPaymentJournal is true then updatePaymentJournal is called with expected params', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      const paymentId = Symbol('payment-id')
      const createdDate = Symbol('created-date')
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)
      getPaymentJournal.mockResolvedValueOnce(true)
      const expctedParams = {
        paymentReference: paymentId,
        paymentTimestamp: createdDate,
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      }

      await processRPResult(mockTransaction.id, paymentId, createdDate)

      expect(updatePaymentJournal).toHaveBeenCalledWith(mockTransaction.id, expctedParams)
    })

    it('if getPaymentJournal is false then updatePaymentJournal is not called', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      const paymentId = Symbol('payment-id')
      const createdDate = Symbol('created-date')
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)
      getPaymentJournal.mockResolvedValueOnce(false)

      await processRPResult(mockTransaction.id, paymentId, createdDate)

      expect(updatePaymentJournal).not.toHaveBeenCalled()
    })

    it('if getPaymentJournal is false then createPaymentJournal is called with expected params', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      const paymentId = Symbol('payment-id')
      const createdDate = Symbol('created-date')
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)
      getPaymentJournal.mockResolvedValueOnce(false)
      const expctedParams = {
        paymentReference: paymentId,
        paymentTimestamp: createdDate,
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      }

      await processRPResult(mockTransaction.id, paymentId, createdDate)

      expect(createPaymentJournal).toHaveBeenCalledWith(mockTransaction.id, expctedParams)
    })

    it('if getPaymentJournal is true then createPaymentJournal is not called', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      const paymentId = Symbol('payment-id')
      const createdDate = Symbol('created-date')
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)
      getPaymentJournal.mockResolvedValueOnce(true)

      await processRPResult(mockTransaction.id, paymentId, createdDate)

      expect(createPaymentJournal).not.toHaveBeenCalled()
    })

    it('should call calculateEndDate with permission', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)
      const {
        permissions: [permission]
      } = mockTransaction

      await processRPResult(mockTransaction.id, '123', '2025-01-01')

      expect(calculateEndDate).toHaveBeenCalledWith(permission)
    })

    it('should call generatePermissionNumber with permission and data source', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      mockTransaction.dataSource = Symbol('data-source')
      const {
        permissions: [permission]
      } = mockTransaction
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)

      await processRPResult(mockTransaction.id, '123', '2025-01-01')

      expect(generatePermissionNumber).toHaveBeenCalledWith(permission, mockTransaction.dataSource)
    })

    it('should call getObfuscatedDob with licensee', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      const {
        permissions: [permission]
      } = mockTransaction
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)

      await processRPResult(mockTransaction.id, '123', '2025-01-01')

      expect(getObfuscatedDob).toHaveBeenCalledWith(permission.licensee)
    })

    it('should call use docClient to create update expression with payload, permissions, status and payment details', async () => {
      const fakeNow = '2024-03-19T14:09:00.000Z'
      jest.setSystemTime(new Date(fakeNow))
      const mockTransaction = getMockTransaction(transactionId)
      const permission = {
        issueDate: fakeNow,
        dataSource: 'RCP',
        licensee: {
          firstName: 'Brenin',
          lastName: 'Pysgotwr',
          obfuscatedDob: '987654678'
        },
        startDate: '2025-03-19T00:00:00.000Z'
      }
      const expectedPermission = {
        ...permission,
        startDate: '2025-03-19T00:00:00.000Z',
        endDate: '2026-03-18T23:59:59.999Z',
        referenceNumber: '123abc'
      }
      mockTransaction.cost = 23.46
      mockTransaction.permissions = [permission]
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)
      generatePermissionNumber.mockReturnValueOnce(expectedPermission.referenceNumber)
      calculateEndDate.mockReturnValueOnce(expectedPermission.endDate)

      await processRPResult(transactionId, '123abc', '2025-01-01')

      expect(docClient.createUpdateExpression).toHaveBeenCalledWith({
        payload: expect.objectContaining(expectedPermission),
        permissions: expect.arrayContaining([expectedPermission]),
        status: expect.objectContaining({ id: TRANSACTION_STATUS.FINALISED }),
        payment: expect.objectContaining({
          amount: mockTransaction.cost,
          method: TRANSACTION_SOURCE.govPay,
          source: PAYMENT_TYPE.debit,
          timestamp: fakeNow
        })
      })
    })

    it('should update DynamoDB with expected params', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      mockTransaction.cost = 38.72
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)
      const updateExpression = { expression: Symbol('update expression') }
      docClient.createUpdateExpression.mockReturnValue(updateExpression)

      await processRPResult(mockTransaction.id, '123', '2025-01-01')

      expect(docClient.update).toHaveBeenCalledWith({
        TableName: TRANSACTION_STAGING_TABLE.TableName,
        Key: { id: transactionId },
        ...updateExpression,
        ReturnValues: 'ALL_NEW'
      })
    })

    it('should send sqs message with expected params', async () => {
      const mockTransaction = getMockTransaction(transactionId)
      retrieveStagedTransaction.mockResolvedValueOnce(mockTransaction)

      await processRPResult(mockTransaction.id, '123', '2025-01-01')

      expect(sqs.sendMessage).toHaveBeenCalledWith({
        QueueUrl: TRANSACTION_QUEUE.Url,
        MessageGroupId: transactionId,
        MessageDeduplicationId: transactionId,
        MessageBody: JSON.stringify({ id: transactionId })
      })
    })
  })
})
