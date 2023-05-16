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

    it.each([[null], [447111111111], [447222222222]])(
      'no mobile number in crm so mobile number set to value in payload',
      async mobilePhone => {
        const contactCRM = [
          {
            mobilePhone: null
          }
        ]
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
        const mockPayload = {
          mobilePhone: mobilePhone
        }
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.mobilePhone).toEqual(mobilePhone)
      }
    )

    it.each([[447111111111], [447222222222], [447333333333]])('mobile number in crm overwritten by value in payload', async mobilePhone => {
      const contactCRM = [
        {
          mobilePhone: 447444444444
        }
      ]
      dynamicsLib.findById.mockImplementationOnce(() => ({}))
      dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
      const mockPayload = {
        mobilePhone: mobilePhone
      }
      const permit = mockPermit()
      const contact = await resolveContactPayload(permit, mockPayload)
      expect(contact.mobilePhone).toEqual(mobilePhone)
    })

    it.each([[447111111111], [447222222222], [447333333333]])(
      'payload for mobile number is null but crm has value so crm value is saved again',
      async mobilePhone => {
        const contactCRM = [
          {
            mobilePhone: mobilePhone
          }
        ]
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
        const mockPayload = {
          mobilePhone: null
        }
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.mobilePhone).toEqual(mobilePhone)
      }
    )

    it.each([[null], ['test@test.com'], ['example@example.com']])('no email in crm so email set to value in payload', async email => {
      const contactCRM = [
        {
          email: null
        }
      ]
      dynamicsLib.findById.mockImplementationOnce(() => ({}))
      dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
      const mockPayload = {
        email: email
      }
      const permit = mockPermit()
      const contact = await resolveContactPayload(permit, mockPayload)
      expect(contact.email).toEqual(email)
    })

    it.each([['test@test.com'], ['example@example.com'], ['email@email.com']])(
      'email in crm overwritten by value in payload',
      async email => {
        const contactCRM = [
          {
            email: 'testing@example.com'
          }
        ]
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
        const mockPayload = {
          email: email
        }
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.email).toEqual(email)
      }
    )

    it.each([['test@test.com'], ['example@example.com'], ['email@email.com']])(
      'payload for email is null but crm has value so crm value is saved again',
      async email => {
        const contactCRM = [
          {
            mobilePhone: email
          }
        ]
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
        const mockPayload = {
          email: null
        }
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.mobilePhone).toEqual(email)
      }
    )

    describe.each(['Letter', 'Email', 'Text'])('contact does not exist in crm', method => {
      it(`preferredMethodOfReminder is set to ${method}`, async () => {
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => [])
        const mockPayload = {
          preferredMethodOfReminder: method
        }
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.preferredMethodOfReminder.description).toEqual(method)
      })

      it(`preferredMethodOfConfirmation is set to ${method}`, async () => {
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => [])
        const mockPayload = {
          preferredMethodOfConfirmation: method
        }
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.preferredMethodOfConfirmation.description).toEqual(method)
      })

      it(`shortTermPreferredMethodOfConfirmation is set to ${method}`, async () => {
        dynamicsLib.findById.mockImplementationOnce(() => ({}))
        dynamicsLib.findByExample.mockImplementationOnce(() => [])
        const mockPayload = {
          preferredMethodOfConfirmation: method
        }
        const permit = mockPermit()
        const contact = await resolveContactPayload(permit, mockPayload)
        expect(contact.shortTermPreferredMethodOfConfirmation.description).toEqual(method)
      })
    })

    describe.each(['Letter', 'Email', 'Text'])('contact exists in crm', method => {
      describe('long term licence', () => {
        it(`preferredMethodOfReminder is set to ${method}`, async () => {
          const contactCRM = [
            {
              preferredMethodOfReminder: { id: 910400000, label: method, description: method }
            }
          ]
          dynamicsLib.findById.mockImplementationOnce(() => ({}))
          dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
          const mockPayload = mockContactPayload()
          const permit = mockPermit()
          const contact = await resolveContactPayload(permit, mockPayload)
          expect(contact.preferredMethodOfReminder).toEqual(contactCRM[0].preferredMethodOfReminder)
        })

        it(`preferredMethodOfConfirmation is set to ${method}`, async () => {
          const contactCRM = [
            {
              preferredMethodOfConfirmation: {
                id: 910400000,
                label: method,
                description: method
              }
            }
          ]
          dynamicsLib.findById.mockImplementationOnce(() => ({}))
          dynamicsLib.findByExample.mockImplementationOnce(() => contactCRM)
          const mockPayload = mockContactPayload()
          const permit = mockPermit()
          const contact = await resolveContactPayload(permit, mockPayload)
          expect(contact.preferredMethodOfConfirmation).toEqual(contactCRM[0].preferredMethodOfConfirmation)
        })
      })

      describe('short term licence', () => {
        it(`shortTermPreferredMethodOfConfirmation is set to ${method}`, async () => {
          const contactCRM = [
            {
              preferredMethodOfConfirmation: {
                id: 910400000,
                label: method,
                description: method
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
        })
      })
    })
  })
})
