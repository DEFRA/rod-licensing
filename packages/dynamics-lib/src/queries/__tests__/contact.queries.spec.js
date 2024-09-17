import { contactForLicensee } from '../contact.queries.js'
import { dynamicsClient } from '../../client/dynamics-client.js'

// Mock the dynamicsClient
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

      expect(result.ContactId).toBeNull()
      expect(result.FirstName).toBeNull()
      expect(result.LastName).toBeNull()
      expect(result.DateOfBirth).toBeNull()
      expect(result.Premises).toBeNull()
      expect(result.Street).toBeNull()
      expect(result.Town).toBeNull()
      expect(result.Locality).toBeNull()
      expect(result.Postcode).toBeNull()
      expect(result.ReturnStatus).toBe('error')
      expect(result.SuccessMessage).toBe('')
      expect(result.ErrorMessage).toBe('contact does not exists')
      expect(result.ReturnPermissionNumber).toBeNull()
    })
  })
})
