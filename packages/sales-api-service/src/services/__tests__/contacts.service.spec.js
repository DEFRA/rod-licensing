import { resolveContactPayload, generateDobId, getRandomInt } from '../contacts.service.js'
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

    it('generates an obfuscated date of birth if it is not present', async () => {
      const mockPayload = mockContactPayload()
      dynamicsLib.findByExample.mockImplementationOnce(() => [])
      const contact = await resolveContactPayload(mockPayload)
      expect(contact.obfuscatedDob).toContain('20000101')
    })

    it('does not generate a new obfuscated date of birth if it is already present', async () => {
      const mockPayload = mockContactPayload()
      mockPayload.obfuscatedDob = '87200001013460'
      dynamicsLib.findByExample.mockImplementationOnce(() => [])
      const contact = await resolveContactPayload(mockPayload)
      expect(contact.obfuscatedDob).toBe('87200001013460')
    })
  })

  describe('generateDobId', () => {
    it('generates string that contains the date of birth padded by 2 random numbers at the start and 4 random numbers at the end', () => {
      const obfuscatedDob = generateDobId('2000-01-01')
      expect(obfuscatedDob.substring(2,10)).toBe('20000101')

      const obfuscatedDobFirstPart = parseInt(obfuscatedDob.substring(0,2))
      expect(obfuscatedDobFirstPart).toBeGreaterThanOrEqual(10)
      expect(obfuscatedDobFirstPart).toBeLessThanOrEqual(99)

      const obfuscatedDobSecondPart = parseInt(obfuscatedDob.substring(10,14))
      expect(obfuscatedDobSecondPart).toBeGreaterThanOrEqual(1000)
      expect(obfuscatedDobSecondPart).toBeLessThanOrEqual(9999)
    })
  })

  describe('getRandomInt', () => {
    it('gets a random integer between a range', () => {
      const randomInt = getRandomInt(10, 99)
      expect(randomInt).toBeGreaterThanOrEqual(10)
      expect(randomInt).toBeLessThanOrEqual(99)
    })

    it('gets a random integer between a negative range', () => {
      const randomInt = getRandomInt(-10, 10)
      expect(randomInt).toBeGreaterThanOrEqual(-10)
      expect(randomInt).toBeLessThanOrEqual(10)
    })
  })
})
