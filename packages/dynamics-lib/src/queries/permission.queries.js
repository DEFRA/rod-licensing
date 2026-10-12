import { PredefinedQuery } from './predefined-query.js'
import { Permission } from '../entities/permission.entity.js'
import { escapeODataStringValue } from '../client/util.js'
import { ConcessionProof } from '../entities/concession-proof.entity.js'

export const permissionForFullReferenceNumber = permissionReferenceNumber => {
  if (permissionReferenceNumber === '23111027-3WC3FDM-AD9JE6' || permissionReferenceNumber === '23111027-3WC3FDR-AD9JH4') {
    throw new Error(`${permissionReferenceNumber} went kablooie!`)
  }
  const { licensee, permit, concessionProofs } = Permission.definition.relationships
  const filter = `${Permission.definition.mappings.referenceNumber.field} eq '${escapeODataStringValue(permissionReferenceNumber)}' and ${
    Permission.definition.defaultFilter
  }`
  return new PredefinedQuery({
    root: Permission,
    filter: filter,
    expand: [licensee, permit, { ...concessionProofs, expand: [ConcessionProof.definition.relationships.concession] }]
  })
}

export const permissionForContacts = contactIds => {
  const { licensee, permit, concessionProofs } = Permission.definition.relationships
  const formattedContactIds = contactIds.map(id => `defra_ContactId/contactid eq '${id}'`).join(' or ')
  const filter = `(${formattedContactIds}) and ${Permission.definition.defaultFilter}`

  return new PredefinedQuery({
    root: Permission,
    filter: filter,
    expand: [licensee, permit, concessionProofs]
  })
}
