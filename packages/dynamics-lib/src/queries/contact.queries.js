import { Contact } from '../entities/contact.entity.js'
import { Permission } from '../entities/permission.entity.js'
import { escapeODataStringValue } from '../client/util.js'
import { PredefinedQuery } from './predefined-query.js'

export const contactForLicenseeNoReference = (licenseeBirthDate, licenseePostcode) => {
  const { postcode, birthDate } = Contact.definition.mappings
  const filter = `${postcode.field} eq '${escapeODataStringValue(licenseePostcode)}' and ${birthDate.field} eq ${licenseeBirthDate} and ${
    Contact.definition.defaultFilter
  }`
  return new PredefinedQuery({
    root: Contact,
    filter,
    expand: []
  })
}

/**
 * Gets the query to get a contact by the last 6 characters if their license number and postcode
 *
 * @param {string} permissionLast6Characters the last 6 characters of the permission reference number
 * @param {string} licenseePostcode the postcode of the contact associated with the permission
 * @returns {PredefinedQuery<Permission>} returns a query as an object to fetch the contact
 */

export const contactAndPermissionForLicensee = (permissionLast6Characters, licenseePostcode) => {
  const { referenceNumber, issueDate } = Permission.definition.mappings
  const { licensee } = Permission.definition.relationships
  const { id } = Contact.definition.mappings

  const filter = `endswith(${referenceNumber.field}, '${escapeODataStringValue(permissionLast6Characters)}') and ${
    Permission.definition.defaultFilter
  } and ${licensee.property}/${Contact.definition.mappings.postcode.field} eq '${escapeODataStringValue(licenseePostcode)}'`
  const orderBy = [`${issueDate.field} desc`, `${licensee.property}/${id.field} asc`]

  const query = new PredefinedQuery({
    root: Permission,
    filter,
    orderBy
  })

  query._retrieveRequest.expand = [
    {
      property: Permission.definition.relationships.licensee.property,
      select: [Contact.definition.mappings.id.field, Contact.definition.mappings.postcode.field]
    }
  ]

  return query
}
