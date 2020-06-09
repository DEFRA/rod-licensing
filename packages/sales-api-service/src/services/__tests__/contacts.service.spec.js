import { resolveContactPayload } from '../contacts.service.js'
import { mockContactPayload, mockContactWithIdPayload, MOCK_EXISTING_CONTACT_ENTITY } from '../../__mocks__/test-data.js'
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
      const contact = await resolveContactPayload(mockPayload)
      expect(contact.isNew()).toBeFalsy()
      expect(dynamicsLib.findById).toHaveBeenCalledWith(Contact, mockPayload.id)
    })

    it('creates a new contact entity if no contact found for an id', async () => {
      const mockPayload = mockContactWithIdPayload()
      dynamicsLib.findById.mockImplementationOnce(() => undefined)
      const contact = await resolveContactPayload(mockPayload)
      expect(contact.isNew()).toBeTruthy()
      expect(dynamicsLib.findById).toHaveBeenCalledWith(Contact, mockPayload.id)
    })

    it('resolves an existing contact by key fields', async () => {
      const mockPayload = mockContactPayload()
      const contact = await resolveContactPayload(mockPayload)
      expect(contact.isNew()).toBeFalsy()
      expect(dynamicsLib.findByExample).toHaveBeenCalledWith(findByExampleCallExpectation)
    })

    it('creates a new contact entity if no contact found key fields', async () => {
      const mockPayload = mockContactPayload()
      dynamicsLib.findByExample.mockImplementationOnce(() => [])
      const contact = await resolveContactPayload(mockPayload)
      expect(contact.isNew()).toBeTruthy()
      expect(dynamicsLib.findByExample).toHaveBeenCalledWith(findByExampleCallExpectation)
    })
  })
})
