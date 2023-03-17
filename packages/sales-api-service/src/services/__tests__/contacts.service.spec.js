import { resolveContactPayload, getObfuscatedDob } from '../contacts.service.js'
import {
  mockContactPayload,
  mockContactWithIdPayload,
  MOCK_EXISTING_CONTACT_ENTITY,
  MOCK_OBFUSCATED_DOB,
  mockPermissionPayload
} from '../../__mocks__/test-data.js'
import { Contact } from '@defra-fish/dynamics-lib'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  findByExample: jest.fn(() => [MOCK_EXISTING_CONTACT_ENTITY]),
  findById: jest.fn(() => MOCK_EXISTING_CONTACT_ENTITY)
}))
const dynamicsLib = jest.requireMock('@defra-fish/dynamics-lib')

describe('contacts service', () => {
  describe('resolveContactPayload', () => {
    const mockPayload = mockContactPayload()
    const findByExampleCallExpectation = expect.objectContaining({
      firstName: mockPayload.firstName,
      lastName: mockPayload.lastName,
      birthDate: mockPayload.birthDate,
      premises: mockPayload.premises,
      postcode: mockPayload.postcode
    })

    it('resolves an existing contact by id', async () => {
      const mockPayload = mockContactWithIdPayload()
      const mockPermission = mockPermissionPayload()
      const contact = await resolveContactPayload(mockPermission, mockPayload)
      expect(contact.isNew()).toBeFalsy()
      expect(dynamicsLib.findById).toHaveBeenCalledWith(Contact, mockPayload.id)
    })

    it('creates a new contact entity if no contact found for an id', async () => {
      const mockPayload = mockContactWithIdPayload()
      const mockPermission = mockPermissionPayload()
      dynamicsLib.findById.mockImplementationOnce(() => undefined)
      const contact = await resolveContactPayload(mockPermission, mockPayload)
      expect(contact.isNew()).toBeTruthy()
      expect(dynamicsLib.findById).toHaveBeenCalledWith(Contact, mockPayload.id)
    })

    it('resolves an existing contact by key fields', async () => {
      const mockPayload = mockContactPayload()
      const mockPermission = mockPermissionPayload()
      const contact = await resolveContactPayload(mockPermission, mockPayload)
      expect(contact.isNew()).toBeFalsy()
      expect(dynamicsLib.findByExample).toHaveBeenCalledWith(findByExampleCallExpectation)
    })

    it('creates a new contact entity if no contact found key fields', async () => {
      const mockPayload = mockContactPayload()
      const mockPermission = mockPermissionPayload()
      dynamicsLib.findByExample.mockImplementationOnce(() => [])
      const contact = await resolveContactPayload(mockPermission, mockPayload)
      expect(contact.isNew()).toBeTruthy()
      expect(dynamicsLib.findByExample).toHaveBeenCalledWith(findByExampleCallExpectation)
    })

    it('licence is not 12 months and contact exists in CRM', async () => {
      const mockPayload = mockContactPayload()
      const mockPermission = {
        licenceLength: '1D'
      }
      const contact = await resolveContactPayload(mockPermission, mockPayload)
      expect(contact.preferredMethodOfConfirmation.description).not.toEqual(contact.shortTermPreferredMethodOfConfirmation.description)
    })

    it('licence is 12 months and contact exists in CRM', async () => {
      const mockPayload = mockContactPayload()
      const mockPermission = {
        licenceLength: '12M'
      }
      const contact = await resolveContactPayload(mockPermission, mockPayload)
      expect(contact.preferredMethodOfConfirmation.description).toEqual(contact.shortTermPreferredMethodOfConfirmation.description)
    })
  })

  describe('getObfuscatedDob', () => {
    it('generates an obfuscated date of birth if it is not present', async () => {
      const mockPayload = mockContactWithIdPayload()
      dynamicsLib.findById.mockImplementationOnce(() => {})
      const obfuscatedDob = await getObfuscatedDob(mockPayload)
      expect(obfuscatedDob).toContain('20000101')
    })

    it('does not generate a new obfuscated date of birth if it is already present', async () => {
      const mockPayload = mockContactWithIdPayload()
      dynamicsLib.findById.mockImplementationOnce(() => ({ obfuscatedDob: MOCK_OBFUSCATED_DOB }))
      const obfuscatedDob = await getObfuscatedDob(mockPayload)
      expect(obfuscatedDob).toBe(MOCK_OBFUSCATED_DOB)
    })
  })
})
