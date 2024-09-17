import { dynamicsClient } from '../client/dynamics-client.js'
// eslint-disable-next-line no-unused-vars
import { ContactByLicenceAndPostcode } from '../entities/contact-by-licence-and-postcode.entity.js'

/**
 * Calls the defra_GetContactByLicenceAndPostcode CRM plugin to retrieve a contact by the last 6 characters if their license number and postcode
 *
 * @param permissionReferenceNumberLast6Characters the last 6 characters of the permission reference number
 * @param licenseePostcode the postcode of the contact associated with the permission
 * @returns {Promise<ContactByLicenceAndPostcode>}
 */

export const contactForLicensee = (permissionReferenceNumberLast6Characters, licenseePostcode) => {
  const request = {
    PermissionNumber: permissionReferenceNumberLast6Characters,
    InputPostCode: licenseePostcode
  }

  return dynamicsClient.executeUnboundAction('defra_GetContactByLicenceAndPostcode', request)
}
