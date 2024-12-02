import { findDueRecurringPayments } from '@defra-fish/dynamics-lib'
import { getRecurringPayments, processRecurringPayment, generateRecurringPaymentRecord } from '../recurring-payments.service.js'
import { createHash } from 'node:crypto'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  executeQuery: jest.fn(),
  findById: jest.fn(),
  findDueRecurringPayments: jest.fn()
}))

jest.mock('node:crypto', () => ({
  createHash: jest.fn(() => ({
    update: () => {},
    digest: () => 'abcdef99987'
  }))
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

describe('recurring payments service', () => {
  const createSampleTransactionRecord = () => ({ payment: { recurring: true }, permissions: [{}] })

  beforeEach(jest.clearAllMocks)
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
      const result = await processRecurringPayment(createSampleTransactionRecord(), getMockContact())
      expect(result.recurringPayment.publicId).toBe(samplePublicId)
    })

    it('passes the unique id of the entity to the hash.update function', async () => {
      const update = jest.fn()
      createHash.mockReturnValueOnce({
        update,
        digest: () => {}
      })
      const { recurringPayment } = await processRecurringPayment(createSampleTransactionRecord(), getMockContact())
      expect(update).toHaveBeenCalledWith(recurringPayment.uniqueContentId)
    })

    it('hashes using sha256', async () => {
      await processRecurringPayment(createSampleTransactionRecord(), getMockContact())
      expect(createHash).toHaveBeenCalledWith('sha256')
    })

    it('uses base64 hash string', async () => {
      const digest = jest.fn()
      createHash.mockReturnValueOnce({
        update: () => {},
        digest
      })
      await processRecurringPayment(createSampleTransactionRecord(), getMockContact())
      expect(digest).toHaveBeenCalledWith('base64')
    })
  })

  describe('generateRecurringPaymentRecord', () => {
    const generateSampleTransaction = (agreementId, permission) => ({
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
      ]
    ])('creates record from transaction with %s', (_d, agreementId, permission, expectedNextDueDate) => {
      const sampleTransaction = generateSampleTransaction(agreementId, permission)

      const rpRecord = generateRecurringPaymentRecord(sampleTransaction)

      expect(rpRecord).toEqual(
        expect.objectContaining({
          payment: expect.objectContaining({
            recurring: expect.objectContaining({
              name: '',
              nextDueDate: expectedNextDueDate,
              cancelledDate: null,
              cancelledReason: null,
              endDate: permission.endDate,
              agreementId,
              status: 1
            })
          }),
          permissions: expect.arrayContaining([expect.objectContaining(permission)])
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
      const sampleTransaction = generateSampleTransaction('hyu78ijhyu78ijuhyu78ij9iu6', permission)

      expect(() => generateRecurringPaymentRecord(sampleTransaction)).toThrow('Invalid dates provided for permission')
    })
  })
})
