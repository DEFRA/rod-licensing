import { createCRMActivity } from '../activity.queries.js'
import { dynamicsClient } from '../../client/dynamics-client.js'

jest.mock('dynamics-web-api', () => {
  return jest.fn().mockImplementation(() => {
    return {
      executeUnboundAction: jest.fn()
    }
  })
})

describe('Activity Service', () => {
  describe('createCRMActivity', () => {
    const mockResponse = {
      '@odata.context': 'https://dynamics.com/api/data/v9.1/defra_CreateRCRActivityResponse',
      RCRActivityId: 'abc123',
      ReturnStatus: 'success',
      SuccessMessage: 'RCR Activity - created successfully',
      ErrorMessage: null,
      oDataContext: 'https://dynamics.com/api/data/v9.1/defra_CreateRCRActivityResponse'
    }

    const errorResponse = {
      '@odata.context': 'https://dynamics.com/api/data/v9.1/.defra_CreateRCRActivityResponse',
      RCRActivityId: null,
      ReturnStatus: 'error',
      SuccessMessage: '',
      ErrorMessage: 'Failed to create activity',
      oDataContext: 'https://dynamics.com/api/data/v9.1/$metadata#Microsoft.Dynamics.CRM.defra_CreateRCRActivityResponse'
    }

    it('should call dynamicsClient with correct parameters', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(mockResponse)

      await createCRMActivity('contact-identifier-123', 2023)

      expect(dynamicsClient.executeUnboundAction).toHaveBeenCalledWith('defra_CreateRCRActivity', {
        ContactId: 'contact-identifier-123',
        ActivityStatus: 'STARTED',
        Season: 2023
      })
    })

    it('should return the CRM response correctly', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(mockResponse)

      const result = await createCRMActivity('contact-identifier-123', 2024)

      expect(result).toEqual(mockResponse)
    })

    it('should handle error in dynamicsClient response', async () => {
      const error = new Error('Failed to create activity')
      dynamicsClient.executeUnboundAction.mockRejectedValue(error)

      await expect(createCRMActivity('contact-identifier-123', 2024)).rejects.toThrow('Failed to create activity')
    })

    it('should handle the case where activity creation fails', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(errorResponse)

      const result = await createCRMActivity('invalid-contact-id', 2024)

      expect(result).toMatchObject({
        RCRActivityId: null,
        ReturnStatus: 'error',
        SuccessMessage: '',
        ErrorMessage: 'Failed to create activity'
      })
    })
  })
})
