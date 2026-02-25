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
 * @param permissionLast6Characters the last 6 characters of the permission reference number
 * @param licenseePostcode the postcode of the contact associated with the permission
 * @returns {Object} returns a query as an object to fetch the contact
 */

export const contactAndPermissionForLicensee = (permissionLast6Characters, licenseePostcode) => {
  const filter = `endswith(${Permission.definition.mappings.referenceNumber.field}, '${escapeODataStringValue(
    permissionLast6Characters
  )}') and ${Permission.definition.defaultFilter} and ${Permission.definition.relationships.licensee.property}/${
    Contact.definition.mappings.postcode.field
  } eq '${escapeODataStringValue(licenseePostcode)}'`
  const orderBy = [
    `${Permission.definition.mappings.issueDate.field} desc`,
    `${Permission.definition.relationships.licensee.property}/${Contact.definition.mappings.id.field} asc`
  ]

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
