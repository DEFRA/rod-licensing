import {
  dynamicsClient,
  executeQuery,
  findDueRecurringPayments,
  findRecurringPaymentsByAgreementId,
  findById,
  Permission,
  persist,
  RecurringPayment,
  findRecurringPaymentByPermissionId,
  retrieveGlobalOptionSets
} from '@defra-fish/dynamics-lib'
import {
  getRecurringPayments,
  processRecurringPayment,
  generateRecurringPaymentRecord,
  processRPResult,
  findNewestExistingRecurringPaymentInCrm,
  getRecurringPaymentAgreement,
  cancelRecurringPayment,
  findLinkedRecurringPayment
} from '../recurring-payments.service.js'
import { calculateEndDate, generatePermissionNumber } from '../permissions.service.js'
import { getObfuscatedDob } from '../contacts.service.js'
import { createHash } from 'node:crypto'
import { AWS, govUkPayApi } from '@defra-fish/connectors-lib'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_QUEUE } from '../../config.js'
import { TRANSACTION_STATUS } from '../../services/transactions/constants.js'
import { retrieveStagedTransaction } from '../../services/transactions/retrieve-transaction.js'
import { createPaymentJournal, getPaymentJournal, updatePaymentJournal } from '../../services/paymentjournals/payment-journals.service.js'
import { getGlobalOptionSetValue } from '../reference-data.service.js'
import { PAYMENT_JOURNAL_STATUS_CODES, TRANSACTION_SOURCE, PAYMENT_TYPE } from '@defra-fish/business-rules-lib'
import db from 'debug'

jest.mock('ioredis', () => ({
  built: {
    utils: {
      debug: jest.fn()
    }
  }
}))

jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'sales:recurring')]

const { docClient, sqs } = AWS.mock.results[0].value

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  executeQuery: jest.fn(),
  findById: jest.fn(),
  findDueRecurringPayments: jest.fn(),
  findRecurringPaymentsByAgreementId: jest.fn(() => ({ toRetrieveRequest: () => {} })),
  dynamicsClient: {
    retrieveMultipleRequest: jest.fn(() => ({ value: [] }))
  },
  persist: jest.fn(),
  findRecurringPaymentByPermissionId: jest.fn(() => ({ toRetrieveRequest: () => {} })),
  retrieveGlobalOptionSets: jest.fn()
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
  })),
  govUkPayApi: {
    getRecurringPaymentAgreementInformation: jest.fn()
  }
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

jest.mock('../reference-data.service.js', () => ({
  getGlobalOptionSetValue: jest.fn(() => ({
    description: 'Payment Failure',
    id: 910400002,
    label: 'Payment Failure'
  }))
}))

jest.mock('@defra-fish/business-rules-lib', () => ({
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
global.structuredClone = obj => JSON.parse(JSON.stringify(obj))

const getMockRecurringPayment = (overrides = {}) => ({
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
  },
  ...overrides
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

const getMockResponse = () => ({
  '@odata.context': 'https://ea-fish-devsandbox.crm4.dynamics.com/api/data/v9.1/$metadata#defra_recurringpayments',
  value: [
    {
      '@odata.etag': 'W/"183695502"',
      defra_recurringpaymentid: 'ed8e5dc7-d346-f011-877a-6045bde009c2',
      defra_name: null,
      statecode: 1,
      defra_nextduedate: '2025-06-11T00:00:00Z',
      defra_cancelleddate: null,
      defra_cancelledreason: null,
      defra_enddate: '2025-06-20T22:59:59Z',
      defra_agreementid: 's6i8q2lcrgqene2s8u1qeaiel6',
      defra_publicid: 'JIwepr5/XgxwLHF9u20F1veSdWqeMJz/dzVfjPKrflM=',
      defra_lastdigitscardnumbers: null
    },
    {
      '@odata.etag': 'W/"184173292"',
      statecode: 1,
      defra_recurringpaymentid: 'f5011f95-ac47-f011-877a-6045bde009c2',
      defra_publicid: '/KTtr4kFQvLwSP3Xz/xAxh9jWbGuzW17ALni4rmip4k=',
      defra_cancelleddate: null,
      defra_inceptionmonth: null,
      defra_cancelledreason: null,
      defra_nextduedate: '2026-06-10T00:00:00Z',
      defra_last_digits_card_number: null,
      defra_enddate: '2026-06-20T22:59:59Z',
      defra_agreementid: 's6i8q2lcrgqene2s8u1qeaiel6',
      defra_lastdigitscardnumbers: null,
      defra_name: null
    },
    {
      '@odata.etag': 'W/"184173352"',
      statecode: 1,
      defra_recurringpaymentid: '0d021f95-ac47-f011-877a-6045bde009c2',
      defra_publicid: 'y3vgHMkqiMyp0vyb3rrS9KvqvU+kUl6P4b74X62SFOU=',
      defra_cancelleddate: null,
      defra_cancelledreason: null,
      defra_nextduedate: '2024-06-10T00:00:00Z',
      defra_last_digits_card_number: null,
      defra_enddate: '2024-06-20T22:59:59Z',
      defra_agreementid: 's6i8q2lcrgqene2s8u1qeaiel6',
      defra_lastdigitscardnumbers: null,
      defra_name: null
    }
  ]
})

describe('recurring payments service', () => {
  const createSimpleSampleTransactionRecord = () => ({
    payment: {
      recurring: {
        nextDueDate: '2025-01-01T00:00:00.000Z'
      }
    },
    permissions: [{}]
  })
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
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true, payment_instrument: { card_details: { last_digits_card_number: '1234' } } })
    }
    govUkPayApi.getRecurringPaymentAgreementInformation.mockResolvedValue(mockResponse)
  })

  describe('getRecurringPayments', () => {
    it('should equal result of findDueRecurringPayments query', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const mockContact = mockRecurringPayments[0].expanded.contact
      const mockPermission = mockRecurringPayments[0].expanded.activePermission

      executeQuery.mockResolvedValueOnce(mockRecurringPayments)

      const result = await getRecurringPayments(new Date())

      expect(result).toEqual([getMockRPContactPermission(mockContact, mockPermission)])
    })

    it('executeQuery is called with findDueRecurringPayments with a date', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const mockDate = new Date()
      executeQuery.mockResolvedValueOnce(mockRecurringPayments)

      await getRecurringPayments(mockDate)

      expect(executeQuery).toHaveBeenCalledWith(findDueRecurringPayments(mockDate))
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
            nextDueDate: '2023-11-02T00:00:00.000Z',
            cancelledDate: null,
            cancelledReason: null,
            endDate: '2023-11-12T00:00:00.000Z',
            agreementId: '435678',
            status: 0,
            last_digits_card_number: '0128'
          }
        },
        permissions: [getMockPermission()]
      }
      const contact = getMockContact()
      const result = await processRecurringPayment(transactionRecord, contact)
      expect(result.recurringPayment).toMatchSnapshot()
    })

    it('should set a valid name on the recurringPayment', async () => {
      const transactionRecord = {
        payment: {
          recurring: {
            nextDueDate: '2023-07-07T00:00:00.000Z'
          }
        },
        permissions: [getMockPermission()]
      }
      const result = await processRecurringPayment(transactionRecord, getMockContact())
      expect(result.recurringPayment.name).toBe('Fester Tester 2023')
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
    const createFinalisedSampleTransaction = (agreementId, permission, lastDigitsCardNumbers) => ({
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
      recurringPayment: {
        agreementId
      },
      payment: {
        amount: 35.8,
        source: 'Gov Pay',
        method: 'Debit card',
        timestamp: '2024-11-22T15:00:45.922Z'
      },
      id: 'd26d646f-ed0f-4cf1-b6c1-ccfbbd611757',
      dataSource: 'Web Sales',
      transactionId: 'd26d646f-ed0f-4cf1-b6c1-ccfbbd611757',
      status: { id: 'FINALISED' },
      lastDigitsCardNumbers
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
        '2025-11-12T00:00:00.000Z',
        '1234'
      ],
      [
        'next day start - next due on end date minus ten days',
        '89iujhy7u8i87yu9iokjuij901',
        {
          startDate: '2024-11-23T00:00:00.000Z',
          issueDate: '2024-11-22T15:00:45.922Z',
          endDate: '2025-11-22T23:59:59.999Z'
        },
        '2025-11-12T00:00:00.000Z',
        '5678'
      ],
      [
        'starts ten days after issue - next due on issue date plus one year',
        '9o8u7yhui89u8i9oiu8i8u7yhu',
        {
          startDate: '2024-11-22T00:00:00.000Z',
          issueDate: '2024-11-12T15:00:45.922Z',
          endDate: '2025-11-21T23:59:59.999Z'
        },
        '2025-11-12T00:00:00.000Z',
        '9012'
      ],
      [
        'starts twenty days after issue - next due on issue date plus one year',
        '9o8u7yhui89u8i9oiu8i8u7yhu',
        {
          startDate: '2024-12-01T00:00:00.000Z',
          issueDate: '2024-11-12T15:00:45.922Z',
          endDate: '2025-01-30T23:59:59.999Z'
        },
        '2025-11-12T00:00:00.000Z',
        '3456'
      ],
      [
        'starts thirty-one days after issue date - next due on issue date plus one year',
        '9o8u7yhui89u8i9oiu8i8u7yhu',
        {
          startDate: '2024-12-14T00:00:00.000Z',
          issueDate: '2024-11-12T15:00:45.922Z',
          endDate: '2025-12-13T23:59:59.999Z'
        },
        '2025-11-12T00:00:00.000Z',
        '4321'
      ],
      [
        "issued on 29th Feb '24, starts on 30th March '24 - next due on 28th Feb '25",
        'hy7u8ijhyu78jhyu8iu8hjiujn',
        {
          startDate: '2024-03-30T00:00:00.000Z',
          issueDate: '2024-02-29T12:38:24.123Z',
          endDate: '2025-03-29T23:59:59.999Z'
        },
        '2025-02-28T00:00:00.000Z',
        '7890'
      ],
      [
        "issued on 30th March '25 at 1am, starts at 1:30am - next due on 20th March '26",
        'jhy67uijhy67u87yhtgjui8u7j',
        {
          startDate: '2025-03-30T01:30:00.000Z',
          issueDate: '2025-03-30T01:00:00.000Z',
          endDate: '2026-03-29T23:59:59.999Z'
        },
        '2026-03-20T00:00:00.000Z',
        '1199'
      ]
    ])('creates record from transaction with %s', async (_d, agreementId, permissionData, expectedNextDueDate, lastDigitsCardNumbers) => {
      const mockResponse = {
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ success: true, payment_instrument: { card_details: { last_digits_card_number: lastDigitsCardNumbers } } })
      }
      govUkPayApi.getRecurringPaymentAgreementInformation.mockResolvedValue(mockResponse)
      const sampleTransaction = createFinalisedSampleTransaction(agreementId, permissionData, lastDigitsCardNumbers)
      const permission = createSamplePermission(permissionData)

      const rpRecord = await generateRecurringPaymentRecord(sampleTransaction, permission)

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
              status: 1,
              last_digits_card_number: lastDigitsCardNumbers
            })
          }),
          permissions: expect.arrayContaining([permission])
        })
      )
    })

    it.each([
      [
        'start date equals issue date',
        {
          startDate: '2024-11-11T00:00:00.000Z',
          issueDate: '2024-11-11T00:00:00.000Z',
          endDate: '2025-11-10T23:59:59.999Z'
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
    ])('throws an error for invalid dates when %s', async (_d, permission) => {
      const sampleTransaction = createFinalisedSampleTransaction('hyu78ijhyu78ijuhyu78ij9iu6', permission)

      await expect(generateRecurringPaymentRecord(sampleTransaction)).rejects.toThrow('Invalid dates provided for permission')
    })

    it('returns a false flag when recurringPayment is not present', async () => {
      const sampleTransaction = createFinalisedSampleTransaction()
      delete sampleTransaction.recurringPayment

      const rpRecord = await generateRecurringPaymentRecord(sampleTransaction)

      expect(rpRecord.payment?.recurring).toBeFalsy()
    })

    it('returns a false flag when agreementId is not present', async () => {
      const sampleTransaction = createFinalisedSampleTransaction(
        null,
        {
          startDate: '2024-11-22T15:30:45.922Z',
          issueDate: '2024-11-22T15:00:45.922Z',
          endDate: '2025-11-21T23:59:59.999Z'
        },
        '0123'
      )

      const rpRecord = await generateRecurringPaymentRecord(sampleTransaction)

      expect(rpRecord.payment?.recurring).toBeFalsy()
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
          source: TRANSACTION_SOURCE.govPay,
          method: PAYMENT_TYPE.debit,
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

  describe('findNewestExistingRecurringPaymentInCrm', () => {
    it('passes agreement id to findRecurringPaymentsByAgreementId', async () => {
      const agreementId = Symbol('agreement-id')
      await findNewestExistingRecurringPaymentInCrm(agreementId)
      expect(findRecurringPaymentsByAgreementId).toHaveBeenCalledWith(agreementId)
    })

    it('passes query created by findRecurringPaymentsByAgreementId to retrieveMultipleRequest', async () => {
      const retrieveRequest = Symbol('retrieve request')
      findRecurringPaymentsByAgreementId.mockReturnValueOnce({ toRetrieveRequest: () => retrieveRequest })
      await findNewestExistingRecurringPaymentInCrm()
      expect(dynamicsClient.retrieveMultipleRequest).toHaveBeenCalledWith(retrieveRequest)
    })

    it('returns a Recurring Payment (not a plain object)', async () => {
      jest.spyOn(RecurringPayment, 'fromResponse')
      dynamicsClient.retrieveMultipleRequest.mockReturnValueOnce(getMockResponse())
      const recurringPayment = await findNewestExistingRecurringPaymentInCrm()
      expect(RecurringPayment.fromResponse.mock.results[0].value).toBe(recurringPayment)
    })

    it.each([
      [
        'dataset of three with midpoint most recent',
        [
          { defra_recurringpaymentid: '1', defra_enddate: '2024-05-31T00:37:24.123' },
          { defra_recurringpaymentid: '2', defra_enddate: '2025-05-31T00:37:24.456' },
          { defra_recurringpaymentid: '3', defra_enddate: '2025-05-31T00:37:24.123' }
        ],
        '2'
      ],
      [
        'dataset of five with penultimate most recent',
        [
          { defra_recurringpaymentid: '111-aaa', defra_enddate: '2024-05-31T00:37:24.123' },
          { defra_recurringpaymentid: '222-ddd', defra_enddate: '2022-05-31T00:37:24.456' },
          { defra_recurringpaymentid: '304-jkj', defra_enddate: '2021-05-31T00:37:24.123' },
          { defra_recurringpaymentid: 'abc-123', defra_enddate: '2025-05-31T00:37:24.123' },
          { defra_recurringpaymentid: '908-oid', defra_enddate: '1876-05-30T00:37:24.123' }
        ],
        'abc-123'
      ],
      [
        'dataset of two with last most recent',
        [
          { defra_recurringpaymentid: 'abc-123', defra_enddate: '1876-05-30T00:37:24.123' },
          { defra_recurringpaymentid: '908-oid', defra_enddate: '2025-05-31T00:37:24.123' }
        ],
        '908-oid'
      ]
    ])('returns most recent existing recurring payment from %s', async (_desc, mockResponseData, expectedId) => {
      dynamicsClient.retrieveMultipleRequest.mockReturnValueOnce({ value: mockResponseData })
      const recurringPayment = await findNewestExistingRecurringPaymentInCrm()
      expect(recurringPayment.id).toBe(expectedId)
    })

    it('returns boolean false if no recurring payments found', async () => {
      dynamicsClient.retrieveMultipleRequest.mockReturnValueOnce({ value: [] })
      const recurringPayment = await findNewestExistingRecurringPaymentInCrm()
      expect(recurringPayment).toBeFalsy()
    })
  })

  describe('getRecurringPaymentAgreement', () => {
    const agreementId = '1234'

    it('should send provided agreement id data to Gov.UK Pay', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, payment_instrument: { card_details: { last_digits_card_number: '1234' } } })
      }
      govUkPayApi.getRecurringPaymentAgreementInformation.mockResolvedValue(mockResponse)
      await getRecurringPaymentAgreement(agreementId)
      expect(govUkPayApi.getRecurringPaymentAgreementInformation).toHaveBeenCalledWith(agreementId)
    })

    it('should return response body when payment creation is successful', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, payment_instrument: { card_details: { last_digits_card_number: '1234' } } })
      }
      govUkPayApi.getRecurringPaymentAgreementInformation.mockResolvedValue(mockResponse)

      const result = await getRecurringPaymentAgreement(agreementId)

      expect(result).toEqual({
        success: true,
        payment_instrument: {
          card_details: {
            last_digits_card_number: '1234'
          }
        }
      })
    })

    it('debug should output message when response.ok is true without card details', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, payment_instrument: { card_details: { last_digits_card_number: '1234' } } })
      }
      govUkPayApi.getRecurringPaymentAgreementInformation.mockResolvedValue(mockResponse)

      await getRecurringPaymentAgreement(agreementId)

      expect(debug).toHaveBeenCalledWith('Successfully got recurring payment agreement information: %o', {
        success: true,
        payment_instrument: {}
      })
    })

    it('should throw an error when the response is not ok', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ success: true, payment_instrument: { card_details: { last_digits_card_number: '1234' } } })
      }
      govUkPayApi.getRecurringPaymentAgreementInformation.mockResolvedValue(mockResponse)

      await expect(getRecurringPaymentAgreement(agreementId)).rejects.toThrow('Failure getting agreement in the GOV.UK API service')
    })
  })

  describe('cancelRecurringPayment', () => {
    it('should call findById with RecurringPayment and the provided id', async () => {
      retrieveGlobalOptionSets.mockReturnValueOnce({ cached: jest.fn().mockResolvedValue({ definition: 'mock-def' }) })
      findById.mockReturnValueOnce(getMockRecurringPayment())
      const id = 'abc123'
      await cancelRecurringPayment(id, 'Payment Failure')
      expect(findById).toHaveBeenCalledWith(RecurringPayment, id)
    })

    it('should set the reason based on the provided argument', async () => {
      retrieveGlobalOptionSets.mockReturnValueOnce({ cached: jest.fn().mockResolvedValue({ definition: 'mock-def' }) })
      findById.mockReturnValueOnce(getMockRecurringPayment())
      const reason = Symbol('unique-reason')
      await cancelRecurringPayment('abc123', reason)
      expect(getGlobalOptionSetValue).toHaveBeenCalledWith(RecurringPayment.definition.mappings.cancelledReason.ref, reason)
    })

    it('should set cancelledDate when reason is not User Cancelled and call persist with the updated RecurringPayment', async () => {
      retrieveGlobalOptionSets.mockReturnValueOnce({
        cached: jest.fn().mockResolvedValue({
          defra_cancelledreasons: {
            options: {
              910400002: {
                id: 910400002,
                label: 'Payment Failure',
                description: 'Payment Failure'
              }
            }
          }
        })
      })

      const recurringPayment = getMockRecurringPayment()
      findById.mockReturnValueOnce(recurringPayment)

      const cancelledReason = { description: 'Payment Failure', id: 910400002, label: 'Payment Failure' }

      await cancelRecurringPayment('id', 'Payment Failure')

      expect(persist).toHaveBeenCalledWith([
        expect.objectContaining({
          ...recurringPayment,
          cancelledReason,
          cancelledDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
        })
      ])
    })

    it('should not set cancelledDate when reason is User Cancelled', async () => {
      retrieveGlobalOptionSets.mockReturnValueOnce({
        cached: jest.fn().mockResolvedValue({
          defra_cancelledreasons: {
            options: {
              910400003: {
                id: 910400003,
                label: 'User Cancelled',
                description: 'User Cancelled'
              }
            }
          }
        })
      })

      const cancelledReason = { description: 'User Cancelled', id: 910400003, label: 'User Cancelled' }

      const recurringPayment = { ...getMockRecurringPayment(), cancelledDate: null }
      findById.mockReturnValueOnce(recurringPayment)

      getGlobalOptionSetValue.mockReturnValueOnce(cancelledReason)

      await cancelRecurringPayment('id', 'User Cancelled')

      expect(persist).toHaveBeenCalledWith([
        expect.objectContaining({
          ...recurringPayment,
          cancelledReason,
          cancelledDate: null
        })
      ])
    })

    it('should raise an error when there are no matches', async () => {
      findById.mockReturnValueOnce(undefined)

      await expect(cancelRecurringPayment('id', 'Payment Failure')).rejects.toThrow(
        'Invalid id provided for recurring payment cancellation'
      )
    })
  })

  describe('findLinkedRecurringPayment', () => {
    const arrangeLinkedRcpSuccess = mockResponse => {
      jest.spyOn(RecurringPayment, 'fromResponse')
      dynamicsClient.retrieveMultipleRequest.mockReturnValueOnce(mockResponse)
      retrieveGlobalOptionSets.mockReturnValueOnce({
        cached: jest.fn().mockResolvedValue({ definition: 'mock-def' })
      })
    }

    it('passes permission id to findRecurringPaymentByPermissionId', async () => {
      const permissionId = Symbol('permission-id')
      await findLinkedRecurringPayment(permissionId)
      expect(findRecurringPaymentByPermissionId).toHaveBeenCalledWith(permissionId)
    })

    it('passes query created by findRecurringPaymentByPermissionId to retrieveMultipleRequest', async () => {
      const retrieveRequest = Symbol('retrieve request')
      findRecurringPaymentByPermissionId.mockReturnValueOnce({ toRetrieveRequest: () => retrieveRequest })
      await findLinkedRecurringPayment()
      expect(dynamicsClient.retrieveMultipleRequest).toHaveBeenCalledWith(retrieveRequest)
    })

    it('calls RecurringPayment.fromResponse with response and definitions', async () => {
      arrangeLinkedRcpSuccess(getMockResponse())
      await findLinkedRecurringPayment('abc123')
      expect(RecurringPayment.fromResponse).toHaveBeenCalledWith(expect.any(Object), expect.anything())
    })

    it('returns the RecurringPayment produced by fromResponse', async () => {
      arrangeLinkedRcpSuccess(getMockResponse())
      const recurringPayment = await findLinkedRecurringPayment('abc123')
      expect(RecurringPayment.fromResponse.mock.results[0].value).toBe(recurringPayment)
    })

    it.each([
      [
        'two with last most recent',
        [
          { defra_recurringpaymentid: 'rcp-123', defra_enddate: '2024-01-01T00:00:00Z' },
          { defra_recurringpaymentid: 'rcp-234', defra_enddate: '2025-01-01T00:00:00Z' }
        ],
        'rcp-234'
      ],
      [
        'three with middle most recent',
        [
          { defra_recurringpaymentid: 'rcp-345', defra_enddate: '2023-01-01T00:00:00Z' },
          { defra_recurringpaymentid: 'rcp-456', defra_enddate: '2026-01-01T00:00:00Z' },
          { defra_recurringpaymentid: 'rcp-567', defra_enddate: '2025-01-01T00:00:00Z' }
        ],
        'rcp-456'
      ]
    ])('returns the most recent linked recurring payment (%s)', async (_desc, mockData, expectedId) => {
      dynamicsClient.retrieveMultipleRequest.mockReturnValueOnce({ value: mockData })
      retrieveGlobalOptionSets.mockReturnValueOnce({ cached: jest.fn().mockResolvedValue({ def: 'mock' }) })

      const recurringPayment = await findLinkedRecurringPayment('abc123')
      expect(recurringPayment.id).toBe(expectedId)
    })

    it('returns false if no linked recurring payments found', async () => {
      dynamicsClient.retrieveMultipleRequest.mockReturnValueOnce({ value: [] })
      const recurringPayment = await findLinkedRecurringPayment('abc123')
      expect(recurringPayment).toBeFalsy()
    })
  })
})
