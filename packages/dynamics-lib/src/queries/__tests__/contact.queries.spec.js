import { contactForLicensee, contactForLicenseeNoReference } from '../contact.queries.js'
import { dynamicsClient } from '../../client/dynamics-client.js'
import { Contact } from '../../entities/contact.entity.js'
import { PredefinedQuery } from '../predefined-query.js'

jest.mock('dynamics-web-api', () => {
  return jest.fn().mockImplementation(() => {
    return {
      executeUnboundAction: jest.fn()
    }
  })
})

describe('Contact Queries', () => {
  describe('contactForLicensee', () => {
    const mockResponse = {
      ContactId: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
      FirstName: 'Fester',
      LastName: 'Tester',
      DateOfBirth: '9/13/1946 12:00:00 AM',
      Premises: '47',
      Street: null,
      Town: 'Testerton',
      Locality: null,
      Postcode: 'AB12 3CD',
      ReturnStatus: 'success',
      SuccessMessage: 'contact found successfully',
      ErrorMessage: null,
      ReturnPermissionNumber: '11100420-2WT1SFT-KPMW2C',
      oDataContext: 'https://api.com/api/data/v9.1/$metadata#Microsoft.Dynamics.CRM.defra_GetContactByLicenceAndPostcodeResponse'
    }

    const noContactResponse = {
      ContactId: null,
      FirstName: null,
      LastName: null,
      DateOfBirth: null,
      Premises: null,
      Street: null,
      Town: null,
      Locality: null,
      Postcode: null,
      ReturnStatus: 'error',
      SuccessMessage: '',
      ErrorMessage: 'contact does not exists',
      ReturnPermissionNumber: null,
      oDataContext:
        'https://api.crm4.dynamics.com/api/data/v9.1/$metadata#Microsoft.Dynamics.CRM.defra_GetContactByLicenceAndPostcodeResponse'
    }

    it('should call dynamicsClient with correct parameters', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(mockResponse)

      const permissionNumber = 'KPMW2C'
      const postcode = 'AB12 3CD'

      await contactForLicensee(permissionNumber, postcode)

      expect(dynamicsClient.executeUnboundAction).toHaveBeenCalledWith('defra_GetContactByLicenceAndPostcode', {
        PermissionNumber: permissionNumber,
        InputPostCode: postcode
      })
    })

    it('should return the CRM response correctly', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(mockResponse)

      const result = await contactForLicensee('KPMW2C', 'AB12 3CD')

      expect(result).toEqual(mockResponse)
    })

    it('should handle error in dynamicsClient response', async () => {
      const error = new Error('Failed to fetch data')
      dynamicsClient.executeUnboundAction.mockRejectedValue(error)

      await expect(contactForLicensee('KPMW2C', 'AB12 3CD')).rejects.toThrow('Failed to fetch data')
    })

    it('should handle the case where contact does not exist', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(noContactResponse)

      const result = await contactForLicensee('654321', 'ZZ1 1ZZ')

      expect(result).toMatchObject({
        ContactId: null,
        FirstName: null,
        LastName: null,
        DateOfBirth: null,
        Premises: null,
        Street: null,
        Town: null,
        Locality: null,
        Postcode: null,
        ReturnStatus: 'error',
        SuccessMessage: '',
        ErrorMessage: 'contact does not exists',
        ReturnPermissionNumber: null
      })
    })
  })

  describe('contactForLicenseeNoReference', () => {
    beforeEach(() => {
      jest.resetAllMocks()

      jest.spyOn(Contact.definition, 'mappings', 'get').mockReturnValue({
        postcode: { field: 'mock_postcode' },
        birthDate: { field: 'mock_birthdate' }
      })

      jest.spyOn(Contact.definition, 'defaultFilter', 'get').mockReturnValue('statecode eq 0')
    })

    it('should return a predefined query', () => {
      const result = contactForLicenseeNoReference('03/12/1990', 'AB12 3CD')
      expect(result).toBeInstanceOf(PredefinedQuery)
    })

    it('root should return Contact', () => {
      const result = contactForLicenseeNoReference('03/12/1990', 'AB12 3CD')
      expect(result._root).toEqual(Contact)
    })

    it('should use mocked values for mapping postcode and birth date', () => {
      const result = contactForLicenseeNoReference('03/12/1990', 'AB12 3CD')
      expect(result._retrieveRequest.filter).toEqual(
        expect.stringContaining(Contact.definition.mappings.postcode.field),
        expect.stringContaining(Contact.definition.mappings.birthDate.field)
      )
    })

    it.each([
      ['AB12 3CD', '03/12/1990'],
      ['EF45 6GH', '05/06/1987'],
      ['IJ78 9KL', '14/11/1975']
    ])('should return correct retrieve request when postcode is %s and birth date is %s', (postcode, birthDate) => {
      const result = contactForLicenseeNoReference(birthDate, postcode)

      expect(result._retrieveRequest).toEqual({
        collection: 'contacts',
        expand: [],
        filter: `mock_postcode eq '${postcode}' and mock_birthdate eq ${birthDate} and statecode eq 0`,
        select: expect.any(Array)
      })
    })
  })
})
