import { Contact, RecurringPayment } from '@defra-fish/dynamics-lib'
import { getRecurringPayments, retrieveActivePermissionAndContact, processRecurringPayment } from '../recurring-payments.service.js'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  findByExample: jest.fn(),
  findById: jest.fn(),
  findByDateRange: jest.fn(),
  permissionForLicensee: jest.fn()
}))
const dynamicsLib = jest.requireMock('@defra-fish/dynamics-lib')

const getMockRecurringPayment = () => {
  const recurringPayment = new RecurringPayment()
  recurringPayment.nextDueDate = new Date().toISOString().split('T')[0]
  recurringPayment.contactId = Math.random().toString(36)
  recurringPayment.activePermission = Math.random().toString(36)

  return recurringPayment
}

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

const getMockPermission = referenceNumber =>
  JSON.stringify({
    referenceNumber: referenceNumber,
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

describe('getRecurringPayments', () => {
  it('should return an array of recurring payments', async () => {
    const mockRecurringPayments = [getMockRecurringPayment()]
    dynamicsLib.findByExample.mockResolvedValue(mockRecurringPayments)
    dynamicsLib.findByDateRange.mockResolvedValue(mockRecurringPayments)
    dynamicsLib.findById.mockResolvedValue(getMockContact())

    const result = await getRecurringPayments(new Date())

    expect(result).toEqual(mockRecurringPayments)
  })

  it('findByExample is called with new RecurringPayment', async () => {
    const mockRecurringPayments = [getMockRecurringPayment()]
    dynamicsLib.findByExample.mockResolvedValue(mockRecurringPayments)
    dynamicsLib.findByDateRange.mockResolvedValue(mockRecurringPayments)
    dynamicsLib.findById.mockResolvedValue(getMockContact())

    await getRecurringPayments(new Date())

    expect(dynamicsLib.findByExample).toHaveBeenCalledWith(expect.any(RecurringPayment))
  })

  it('findByDateRange is called with array of recurring payments and a date', async () => {
    const mockRecurringPayments = [getMockRecurringPayment()]
    const mockDate = new Date()
    dynamicsLib.findByExample.mockResolvedValue(mockRecurringPayments)
    dynamicsLib.findByDateRange.mockResolvedValue(mockRecurringPayments)
    dynamicsLib.findById.mockResolvedValue(getMockContact())

    await getRecurringPayments(mockDate)

    expect(dynamicsLib.findByDateRange).toHaveBeenCalledWith(mockRecurringPayments, mockDate)
  })

  describe('retrieveActivePermissionAndContact', () => {
    it('should assign contact to recurring payment', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const mockContact = getMockContact()
      const mockPermission = getMockPermission(mockRecurringPayments[0].activePermission)
      dynamicsLib.findByExample.mockResolvedValue(mockRecurringPayments)
      dynamicsLib.findByDateRange.mockResolvedValue(mockRecurringPayments)
      dynamicsLib.findById.mockResolvedValue(mockContact)
      dynamicsLib.permissionForLicensee.mockReturnValue(mockPermission)

      const result = await retrieveActivePermissionAndContact(mockRecurringPayments)

      expect(result[0].contact).toEqual(mockContact)
    })

    it('should assign permission to recurring payment', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const mockContact = getMockContact()
      const mockPermission = getMockPermission(mockRecurringPayments[0].activePermission)
      dynamicsLib.findByExample.mockResolvedValue(mockRecurringPayments)
      dynamicsLib.findByDateRange.mockResolvedValue(mockRecurringPayments)
      dynamicsLib.findById.mockResolvedValue(mockContact)
      dynamicsLib.permissionForLicensee.mockReturnValue(mockPermission)

      const result = await retrieveActivePermissionAndContact(mockRecurringPayments)
      const parsedPermission = JSON.parse(mockPermission)

      expect(result[0].activePermission).toEqual(JSON.stringify(parsedPermission))
    })

    it('call findById with a contact and an id', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const contactId = mockRecurringPayments[0].contactId
      dynamicsLib.findByExample.mockResolvedValue(mockRecurringPayments)
      dynamicsLib.findByDateRange.mockResolvedValue(mockRecurringPayments)
      dynamicsLib.findById.mockResolvedValue(getMockContact())

      await retrieveActivePermissionAndContact(mockRecurringPayments)

      expect(dynamicsLib.findById).toHaveBeenCalledWith(Contact, contactId)
    })

    it('call permissionForLicensee with an activePermission, date and postcode', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const mockContact = getMockContact()
      const activePermission = mockRecurringPayments[0].activePermission
      const birthDate = mockContact.birthDate
      const postcode = mockContact.postcode
      dynamicsLib.findByExample.mockResolvedValue(mockRecurringPayments)
      dynamicsLib.findByDateRange.mockResolvedValue(mockRecurringPayments)
      dynamicsLib.findById.mockResolvedValue(mockContact)

      await retrieveActivePermissionAndContact(mockRecurringPayments)

      expect(dynamicsLib.permissionForLicensee).toHaveBeenCalledWith(activePermission, birthDate, postcode)
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
})
