import { Contact } from '../entities/contact.entity.js'
import { RCRActivity } from '../entities/rcr-activity.entity.js'
import { escapeODataStringValue } from '../client/util.js'
import { PredefinedQuery } from './predefined-query.js'

// TODO add jsdoc and tests
export const rcrActivityForContact = (contactId, seasonInput) => {
  const { season } = RCRActivity.definition.mappings
  const { licensee } = RCRActivity.definition.relationships
  const { id } = Contact.definition.mappings

  const filter = `${licensee.property}/${id.field} eq '${escapeODataStringValue(contactId)}' and ${season.field} eq ${seasonInput} and ${
    RCRActivity.definition.defaultFilter
  }`
  return new PredefinedQuery({
    root: RCRActivity,
    filter,
    expand: []
  })
}
