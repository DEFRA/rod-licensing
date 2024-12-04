import { PredefinedQuery } from './predefined-query.js'
import { Permission } from '../entities/permission.entity.js'
import { escapeODataStringValue } from '../client/util.js'
import { ConcessionProof } from '../entities/concession-proof.entity.js'

export const permissionForFullReferenceNumber = permissionReferenceNumber => {
  const { licensee, permit, concessionProofs } = Permission.definition.relationships
  let filter = `${Permission.definition.mappings.referenceNumber.field} eq '${escapeODataStringValue(permissionReferenceNumber)}'`
  filter += ` and ${Permission.definition.defaultFilter}`
  return new PredefinedQuery({
    root: Permission,
    filter: filter,
    expand: [licensee, permit, { ...concessionProofs, expand: [ConcessionProof.definition.relationships.concession] }]
  })
}

export const permissionForContacts = contactIds => {
  const { licensee, permit, concessionProofs } = Permission.definition.relationships
  let filter = `${licensee.property}/${licensee.entity.definition.mappings.id.field} in (${contactIds})`
  filter += ` and ${Permission.definition.defaultFilter}`
  return new PredefinedQuery({
    root: Permission,
    filter: filter,
    expand: [licensee, permit, concessionProofs]
  })
}
