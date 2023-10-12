import { Permission, RecurringPayment } from '@defra-fish/dynamics-lib'
import { getRecurringPayments, createRecurringPayment, addLinkedPermissions } from '../recurring-payments.service.js'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  findByExample: jest.fn(),
  findById: jest.fn()
}))
const dynamicsLib = jest.requireMock('@defra-fish/dynamics-lib')

const getMockRecurringPayment = () => {
  const recurringPayment = new RecurringPayment()
  recurringPayment.status = 'Active'
  recurringPayment.nextDueDate = new Date().toISOString().split('T')[0]
  recurringPayment.cancelledDate = null

  return recurringPayment
}

const getMockRecurringPaymentPermission = () => {
  return {
    ...getMockRecurringPayment(),
    activePermission: {
      referenceNumber: '123'
    }
  }
}

const getMockPermission = () => ({
  referenceNumber: '123',
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
  it('getRecurringPayments should return an array', async () => {
    const result = await getRecurringPayments()

    expect(Array.isArray(result)).toBe(true)
  })

  it('console logs recurringPayments', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())

    await getRecurringPayments()

    expect(consoleLogSpy).toHaveBeenCalledWith('recurring payments found: ', [])
    consoleLogSpy.mockRestore()
  })

  it('findByExample is called with return of createRecurringPayment', async () => {
    const mockRecurringPayment = getMockRecurringPayment()

    dynamicsLib.findById.mockResolvedValue(getMockPermission())

    await getRecurringPayments()

    expect(dynamicsLib.findByExample).toHaveBeenNthCalledWith(1, expect.objectContaining({
      status: mockRecurringPayment.status,
      cancelledDate: mockRecurringPayment.cancelledDate,
      nextDueDate: mockRecurringPayment.nextDueDate
    }))
  })

  describe('createRecurringPayment', () => {
    it('should create a recurring payment', () => {
      const mockPayment = getMockRecurringPayment()

      const result = createRecurringPayment('Active', null, new Date().toISOString().split('T')[0])

      expect(result).toMatchObject({
        status: mockPayment.status,
        cancelledDate: mockPayment.cancelledDate,
        nextDueDate: mockPayment.nextDueDate
      })
    })
  })

  describe('addLinkedPermissions', () => {
    it('should add linked permissions to recurring payments', async () => {
      const mockRecurringPayments = [getMockRecurringPaymentPermission(), getMockRecurringPaymentPermission(), getMockRecurringPaymentPermission()]
      const mockPermission = getMockPermission()
      dynamicsLib.findById.mockResolvedValue(mockPermission)

      const result = await addLinkedPermissions(mockRecurringPayments)

      expect(result).toEqual(mockRecurringPayments)
    })

    it('findById is called with a Recurring Payment including a staus, cancelledDate and nextDueDate', async () => {
      const mockRecurringPayment = getMockRecurringPaymentPermission()
      const mockRecurringPayments = [mockRecurringPayment]
      dynamicsLib.findById.mockImplementationOnce(() => [])

      await addLinkedPermissions(mockRecurringPayments)

      expect(dynamicsLib.findById).toHaveBeenCalledWith(Permission, mockRecurringPayment.activePermission.referenceNumber)
    })
  })
})
