import { resolveContactPayload, getObfuscatedDob } from '../contacts.service.js'
import {
  mockContactPayload,
  mockContactWithIdPayload,
  MOCK_EXISTING_CONTACT_ENTITY,
  MOCK_OBFUSCATED_DOB,
  mockPermit
} from '../../__mocks__/test-data.js'
import { Contact } from '@defra-fish/dynamics-lib'

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  findByExample: jest.fn(() => [MOCK_EXISTING_CONTACT_ENTITY]),
  findById: jest.fn(() => MOCK_EXISTING_CONTACT_ENTITY)
}))
const dynamicsLib = jest.requireMock('@defra-fish/dynamics-lib')

describe('contacts service', () => {
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
      const permit = mockPermit()
      const contact = await resolveContactPayload(permit, mockPayload)
      expect(contact.isNew()).toBeFalsy()
      expect(dynamicsLib.findById).toHaveBeenCalledWith(Contact, mockPayload.id)
    })

    it('creates a new contact entity if no contact found for an id', async () => {
      const mockPayload = mockContactWithIdPayload()
      const permit = mockPermit()
      dynamicsLib.findById.mockImplementationOnce(() => undefined)
      const contact = await resolveContactPayload(permit, mockPayload)
      expect(contact.isNew()).toBeTruthy()
      expect(dynamicsLib.findById).toHaveBeenCalledWith(Contact, mockPayload.id)
    })

    it('resolves an existing contact by key fields', async () => {
      const mockPayload = mockContactPayload()
      const permit = mockPermit()
      const contact = await resolveContactPayload(permit, mockPayload)
      expect(contact.isNew()).toBeFalsy()
      expect(dynamicsLib.findByExample).toHaveBeenCalledWith(findByExampleCallExpectation)
    })

    it('creates a new contact entity if no contact found key fields', async () => {
      const mockPayload = mockContactPayload()
      const permit = mockPermit()
      dynamicsLib.findByExample.mockImplementationOnce(() => [])
      const contact = await resolveContactPayload(permit, mockPayload)
      expect(contact.isNew()).toBeTruthy()
      expect(dynamicsLib.findByExample).toHaveBeenCalledWith(findByExampleCallExpectation)
    })

    it('preferredMethodOfNewsletter is set to value of payload preferredMethodOfNewsletter', async () => {
      const mockPayload = mockContactPayload()
      const permit = mockPermit()
      const contact = await resolveContactPayload(permit, mockPayload)
      expect(contact.preferredMethodOfNewsletter.description).toEqual(mockPayload.preferredMethodOfNewsletter)
    })

    describe('contact does not exist in crm', () => {
      it.each([['Letter'], ['Email'], ['Text']])(
        'preferredMethodOfReminder is set to value of payload preferredMethodOfReminder',
        async preferredMethodOfReminder => {
          dynamicsLib.findById.mockImplementationOnce(() => ({}))
          dynamicsLib.findByExample.mockImplementationOnce(() => [])
          const mockPayload = {
            preferredMethodOfReminder: preferredMethodOfReminder
          }
          const permit = mockPermit()
          const contact = await resolveContactPayload(permit, mockPayload)
          expect(contact.preferredMethodOfReminder.description).toEqual(preferredMethodOfReminder)
        }
      )

      it.each([['Letter'], ['Email'], ['Text']])(
        'preferredMethodOfConfirmation is set to value of payload preferredMethodOfConfirmation',
        async preferredMethodOfConfirmation => {
          dynamicsLib.findById.mockImplementationOnce(() => ({}))
          dynamicsLib.findByExample.mockImplementationOnce(() => [])
          const mockPayload = {
            preferredMethodOfConfirmation: preferredMethodOfConfirmation
          }
          const permit = mockPermit()
          const contact = await resolveContactPayload(permit, mockPayload)
          expect(contact.preferredMethodOfConfirmation.description).toEqual(preferredMethodOfConfirmation)
        }
      )

      it.each([['Letter'], ['Email'], ['Text']])(
        'shortTermPreferredMethodOfConfirmation is set to value of payload preferredMethodOfConfirmation',
        async preferredMethodOfConfirmation => {
          dynamicsLib.findById.mockImplementationOnce(() => ({}))
          dynamicsLib.findByExample.mockImplementationOnce(() => [])
          const mockPayload = {
            preferredMethodOfConfirmation: preferredMethodOfConfirmation
          }
          const permit = mockPermit()
          const contact = await resolveContactPayload(permit, mockPayload)
          expect(contact.shortTermPreferredMethodOfConfirmation.description).toEqual(preferredMethodOfConfirmation)
        }
      )
    })

    describe('contact exists in crm', () => {
      it('contact has no mobilePhone value so mobilePhone is not set from contactInCRM', async () => {
        const contactCRM = [
          {
            mobilePhone: null
          }
        ]
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
        const mockPayload = mockContactPayload()
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.mobilePhone).toEqual(null)
      })

      it('contact has no email so email is not set from contactInCRM', async () => {
        const contactCRM = [
          {
            email: null
          }
        ]
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
        const mockPayload = mockContactPayload()
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.email).toEqual(null)
      })

      it('contact has email value so email is set to value in contactInCRM', async () => {
        const contactCRM = [
          {
            email: 'test@email.com'
          }
        ]
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
        const mockPayload = mockContactPayload()
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.email).toEqual(contactCRM[0].email)
      })

      it('contact has mobilePhone value so mobilePhone value is set to value in contactInCRM', async () => {
        const contactCRM = [
          {
            mobilePhone: '07111111111'
          }
        ]
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
        const mockPayload = mockContactPayload()
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.mobilePhone).toEqual(contactCRM[0].mobilePhone)
      })

      describe('long term licence', () => {
        it.each([['Letter'], ['Email'], ['Text']])(
          'preferredMethodOfReminder is set to value of preferredMethodOfReminder',
          async preferredMethodOfReminder => {
            const contactCRM = [
              {
                preferredMethodOfReminder: { id: 910400000, label: preferredMethodOfReminder, description: preferredMethodOfReminder }
              }
            ]
            dynamicsLib.findById.mockImplementationOnce(() => ({}))
            dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
            const mockPayload = mockContactPayload()
            const permit = mockPermit()
            const contact = await resolveContactPayload(permit, mockPayload)
            expect(contact.preferredMethodOfReminder).toEqual(contactCRM[0].preferredMethodOfReminder)
          }
        )

        it.each([['Letter'], ['Email'], ['Text']])(
          'preferredMethodOfConfirmation is set to value of preferredMethodOfConfirmation',
          async preferredMethodOfConfirmation => {
            const contactCRM = [
              {
                preferredMethodOfConfirmation: {
                  id: 910400000,
                  label: preferredMethodOfConfirmation,
                  description: preferredMethodOfConfirmation
                }
              }
            ]
            dynamicsLib.findById.mockImplementationOnce(() => ({}))
            dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
            const mockPayload = mockContactPayload()
            const permit = mockPermit()
            const contact = await resolveContactPayload(permit, mockPayload)
            expect(contact.preferredMethodOfConfirmation).toEqual(contactCRM[0].preferredMethodOfConfirmation)
          }
        )
      })

      describe('short term licence', () => {
        it.each([['Letter'], ['Email'], ['Text']])(
          'shortTermPreferredMethodOfConfirmation is set to value of preferredMethodOfConfirmation',
          async preferredMethodOfConfirmation => {
            const contactCRM = [
              {
                preferredMethodOfConfirmation: {
                  id: 910400000,
                  label: preferredMethodOfConfirmation,
                  description: preferredMethodOfConfirmation
                }
              }
            ]
            dynamicsLib.findById.mockImplementationOnce(() => ({}))
            dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
            const mockPayload = mockContactPayload()
            const mockShortPermit = {
              durationMagnitude: 1,
              durationDesignator: { id: 910400001, label: 'Month(s)', description: 'D' }
            }
            const contact = await resolveContactPayload(mockShortPermit, mockPayload)
            expect(contact.shortTermPreferredMethodOfConfirmation).toEqual(contactCRM[0].shortTermPreferredMethodOfConfirmation)
          }
        )
      })
    })
  })
})
