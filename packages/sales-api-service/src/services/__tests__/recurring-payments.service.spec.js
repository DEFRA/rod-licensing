import { Permission, RecurringPayment } from '@defra-fish/dynamics-lib'
import { findRecurringPaymentsInDateRange, getRecurringPayments, retrieveActivePermission } from '../recurring-payments.service.js'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  findByExample: jest.fn(),
  findById: jest.fn()
}))
const dynamicsLib = jest.requireMock('@defra-fish/dynamics-lib')

const getMockRecurringPayment = () => {
  const recurringPayment = new RecurringPayment()
  recurringPayment.nextDueDate = new Date().toISOString().split('T')[0]
  recurringPayment.activePermission = recurringPayment.activePermission = Math.random().toString(36)

  return recurringPayment
}

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
    const mockRecurringPayments = [getMockRecurringPayment(), getMockRecurringPayment(), getMockRecurringPayment()]
    dynamicsLib.findByExample.mockResolvedValue(mockRecurringPayments)

    const result = await getRecurringPayments()

    expect(result).toEqual([mockRecurringPayments])
  })

  it('findByExample is called with new RecurringPayment', async () => {
    const mockRecurringPayments = [getMockRecurringPayment()]
    dynamicsLib.findByExample.mockResolvedValue(mockRecurringPayments)

    await getRecurringPayments()

    expect(dynamicsLib.findByExample).toHaveBeenCalledWith(expect.any(RecurringPayment))
  })

  describe('retrieveActivePermission', () => {
    it('should retrieve active permissions for recurring payments', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const mockPermission = getMockPermission(mockRecurringPayments[0].activePermission)
      dynamicsLib.findById.mockResolvedValue(mockPermission)

      const result = await retrieveActivePermission(mockRecurringPayments)
      const parsedPermission = JSON.parse(mockPermission)

      expect(result).toEqual([
        expect.objectContaining({
          nextDueDate: new Date().toISOString().split('T')[0],
          activePermission: JSON.stringify(parsedPermission)
        })
      ])
    })

    it('call findById with a permission and an id', async () => {
      const mockRecurringPayments = [getMockRecurringPayment()]
      const referenceNumber = mockRecurringPayments[0].activePermission

      await retrieveActivePermission(mockRecurringPayments)

      expect(dynamicsLib.findById).toHaveBeenCalledWith(Permission, referenceNumber)
    })
  })

  describe('findRecurringPaymentsInDateRange', () => {
    it('should filter recurring payments within the given date range', async () => {
      const mockRecurringPayments = [getMockRecurringPayment(), getMockRecurringPayment(), getMockRecurringPayment()]
      const mockDueDate = new Date()

      const result = await findRecurringPaymentsInDateRange(mockRecurringPayments, mockDueDate)

      expect(result).toEqual(mockRecurringPayments)
    })
  })
})
