import { dynamicsClient } from '../client/dynamics-client.js'

/**
 * Creates an RCR Activity in Microsoft Dynamics CRM.
 *
 * @param {string} contactId - The ID of the contact associated with the activity.
 * @param {number} season - The season year for which the activity is being created.
 * @returns {Promise<Object>} - A promise that resolves to the response from Dynamics CRM.
 * @property {string} response.@odata.context - The OData context URL of the response.
 * @property {string} response.RCRActivityId - The unique identifier of the created RCR activity.
 * @property {string} response.ReturnStatus - The status of the activity creation operation (e.g., 'success').
 * @property {string} response.SuccessMessage - A message indicating successful creation of the activity.
 * @property {string|null} response.ErrorMessage - An error message if the activity creation failed, otherwise null.
 * @property {string} response.oDataContext - The OData context URL of the response.
 */
export const createActivity = (contactId, season) => {
  const request = {
    ContactId: contactId,
    ActivityStatus: 'STARTED',
    Season: season
  }

  return dynamicsClient.executeUnboundAction('defra_CreateRCRActivity', request)
}
