import { Contact, findDueRecurringPayments, Permission } from '@defra-fish/dynamics-lib'
import { getRecurringPayments, processRecurringPayment } from '../recurring-payments.service.js'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  executeQuery: jest.fn(),
  findById: jest.fn(),
  findDueRecurringPayments: jest.fn()
}))

const dynamicsLib = jest.requireMock('@defra-fish/dynamics-lib')

const getMockRecurringPayment = () => ({
  entity: {
    name: 'Test Name',
    nextDueDate: '2019-12-14T00:00:00Z',
    cancelledDate: null,
    cancelledReason: null,
    endDate: '2019-12-15T00:00:00Z',
    agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472',
    publicId: '649-213',
    status: 1,
    contactId: Math.random().toString(36),
    activePermission: Math.random().toString(36)
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
  contactId: contact,
  activePermission: permission
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
  beforeEach(jest.clearAllMocks)
  describe('getRecurringPayments', () => {
    it('should equal result of findDueRecurringPayments', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const mockContact = getMockContact()
      const mockPermission = getMockPermission()

      dynamicsLib.executeQuery.mockResolvedValueOnce(mockRecurringPayments)
      dynamicsLib.findById.mockResolvedValueOnce(mockContact)
      dynamicsLib.findById.mockResolvedValueOnce(mockPermission)

      const result = await getRecurringPayments(new Date())
      const expected = getMockRPContactPermission(mockContact, mockPermission)

      expect(result).toEqual([expected])
    })

    it('findById is called with Contact and contactId', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      dynamicsLib.executeQuery.mockResolvedValueOnce(mockRecurringPayments)
      const contactId = mockRecurringPayments[0].entity.contactId

      await getRecurringPayments(new Date())

      expect(dynamicsLib.findById).toHaveBeenNthCalledWith(1, Contact, contactId)
    })

    it('findById is called with Permission and activePermission', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      dynamicsLib.executeQuery.mockResolvedValueOnce(mockRecurringPayments)
      const activePermission = mockRecurringPayments[0].entity.activePermission

      await getRecurringPayments(new Date())

      expect(dynamicsLib.findById).toHaveBeenNthCalledWith(2, Permission, activePermission)
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
            publicId: '1234456',
            status: 0
          }
        },
        permissions: [getMockPermission()]
      }
      const contact = getMockContact()
      const result = await processRecurringPayment(transactionRecord, contact)
      expect(result.recurringPayment).toMatchSnapshot()
    })
  })
})
