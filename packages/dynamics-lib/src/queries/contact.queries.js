import { dynamicsClient } from '../client/dynamics-client.js'
import { Contact } from '../entities/contact.entity.js'
import { escapeODataStringValue } from '../client/util.js'
import { PredefinedQuery } from './predefined-query.js'

/**
 * @typedef {Object} ContactByLicenceAndPostcode
 * @property {string|null} ContactId - The contact's unique identifier
 * @property {string|null} FirstName - The contact's first name
 * @property {string|null} LastName - The contact's last name
 * @property {string|null} DateOfBirth - The contact's date of birth
 * @property {string|null} Street - The contact's street
 * @property {string|null} Town - The contact's town
 * @property {string|null} Locality - The contact's locality
 * @property {string|null} Postcode - The contact's postcode
 * @property {string} ReturnStatus - The status of the request (e.g., "success" or "error")
 * @property {string|null} SuccessMessage - A success message if the contact is found
 * @property {string|null} ErrorMessage - An error message if the contact is not found
 * @property {string|null} ReturnPermissionNumber - The full permission number of the contact
 * @property {string} oDataContext - The OData context URL
 */

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

export const contactForLicenseeNoReference = (licenseeBirthDate, licenseePostcode) => {
  let filter = `${Contact.definition.mappings.postcode.field} eq '${escapeODataStringValue(licenseePostcode)}'`
  filter += ` and ${Contact.definition.mappings.birthDate.field} eq ${licenseeBirthDate}`
  filter += ` and ${Contact.definition.defaultFilter}`
  return new PredefinedQuery({
    root: Contact,
    filter: filter,
    expand: []
  })
}
