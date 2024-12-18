import { createActivity, updateActivity } from '../activity.queries.js'
import { dynamicsClient } from '../../client/dynamics-client.js'

jest.mock('dynamics-web-api', () => {
  return jest.fn().mockImplementation(() => {
    return {
      executeUnboundAction: jest.fn()
    }
  })
})

describe('Activity Service', () => {
  describe('createActivity', () => {
    const getSuccessResponse = () => ({
      '@odata.context': 'https://dynamics.com/api/data/v9.1/defra_CreateRCRActivityResponse',
      RCRActivityId: 'abc123',
      ReturnStatus: 'success',
      SuccessMessage: 'RCR Activity - created successfully',
      ErrorMessage: null,
      oDataContext: 'https://dynamics.com/api/data/v9.1/defra_CreateRCRActivityResponse'
    })

    const getErrorResponse = () => ({
      '@odata.context': 'https://dynamics.com/api/data/v9.1/.defra_CreateRCRActivityResponse',
      RCRActivityId: null,
      ReturnStatus: 'error',
      SuccessMessage: '',
      ErrorMessage: 'Failed to create activity',
      oDataContext: 'https://dynamics.com/api/data/v9.1/$metadata#Microsoft.Dynamics.CRM.defra_CreateRCRActivityResponse'
    })

    it('should call dynamicsClient with correct parameters', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(getSuccessResponse())

      await createActivity('contact-identifier-123', 2023)

      expect(dynamicsClient.executeUnboundAction).toHaveBeenCalledWith('defra_CreateRCRActivity', {
        ContactId: 'contact-identifier-123',
        ActivityStatus: 'STARTED',
        Season: 2023
      })
    })

    it('should return the CRM response correctly', async () => {
      const successResponse = getSuccessResponse()
      dynamicsClient.executeUnboundAction.mockResolvedValue(successResponse)

      const result = await createActivity('contact-identifier-123', 2024)

      expect(result).toEqual(successResponse)
    })

    it('should handle error in dynamicsClient response', async () => {
      const error = new Error('Failed to create activity')
      dynamicsClient.executeUnboundAction.mockRejectedValue(error)

      await expect(createActivity('contact-identifier-123', 2024)).rejects.toThrow('Failed to create activity')
    })

    it('should handle the case where activity creation fails', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(getErrorResponse())

      const result = await createActivity('invalid-contact-id', 2024)

      expect(result).toMatchObject({
        RCRActivityId: null,
        ReturnStatus: 'error',
        SuccessMessage: '',
        ErrorMessage: 'Failed to create activity'
      })
    })
  })

  describe('updateActivity', () => {
    const getSuccessResponse = () => ({
      '@odata.context': 'https://dynamics.om/api/data/v9.1/defra_UpdateRCRActivityResponse',
      ReturnStatus: 'success',
      SuccessMessage: 'RCR Activity - updated successfully',
      ErrorMessage: null,
      oDataContext: 'https://dynamics.com/api/data/v9.1/defra_UpdateRCRActivityResponse'
    })

    const getErrorResponse = () => ({
      '@odata.context': 'https://dynamics.om/api/data/v9.1/defra_UpdateRCRActivityResponse',
      RCRActivityId: null,
      ReturnStatus: 'error',
      SuccessMessage: '',
      ErrorMessage: 'Failed to update activity',
      oDataContext: 'https://dynamics.com/api/data/v9.1/defra_UpdateRCRActivityResponse'
    })

    it('should call dynamicsClient with correct parameters', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(getSuccessResponse())

      await updateActivity('contact-identifier-123', 2023)

      expect(dynamicsClient.executeUnboundAction).toHaveBeenCalledWith('defra_UpdateRCRActivity', {
        ContactId: 'contact-identifier-123',
        ActivityStatus: 'SUBMITTED',
        Season: 2023
      })
    })

    it('should return the CRM response correctly', async () => {
      const successResponse = getSuccessResponse()
      dynamicsClient.executeUnboundAction.mockResolvedValue(successResponse)

      const result = await updateActivity('contact-identifier-123', 2024)

      expect(result).toEqual(successResponse)
    })

    it('should handle error in dynamicsClient response', async () => {
      const error = new Error('Failed to update activity')
      dynamicsClient.executeUnboundAction.mockRejectedValue(error)

      await expect(updateActivity('contact-identifier-123', 2024)).rejects.toThrow('Failed to update activity')
    })

    it('should handle the case where activity creation fails', async () => {
      dynamicsClient.executeUnboundAction.mockResolvedValue(getErrorResponse())

      const result = await updateActivity('invalid-contact-id', 2024)

      expect(result).toMatchObject({
        RCRActivityId: null,
        ReturnStatus: 'error',
        SuccessMessage: '',
        ErrorMessage: 'Failed to update activity'
      })
    })
  })
})
