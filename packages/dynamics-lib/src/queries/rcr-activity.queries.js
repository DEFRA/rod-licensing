import { Contact } from '../entities/contact.entity.js'
import { RCRActivity } from '../entities/rcr-activity.entity.js'
import { escapeODataStringValue } from '../client/util.js'
import { PredefinedQuery } from './predefined-query.js'

/**
 * Creates a predefined OData query for retrieving {@link RCRActivity} records
 * associated with a specific contact id and season.
 *
 * @param {string} contactId The unique identifier of the {@link Contact}.
 * @param {string|number} seasonInput The season value to filter activities by.
 * @returns {PredefinedQuery<RCRActivity>} returns a query as an object to fetch the contact
 */
export const rcrActivityForContact = (contactId, seasonInput) => {
  const { season } = RCRActivity.definition.mappings
  const { licensee } = RCRActivity.definition.relationships
  const { id } = Contact.definition.mappings

  const filter = `${licensee.property}/${id.field} eq '${escapeODataStringValue(contactId)}' and ${
    season.field
  } eq ${escapeODataStringValue(seasonInput)} and ${RCRActivity.definition.defaultFilter}`
  return new PredefinedQuery({
    root: RCRActivity,
    filter,
    expand: []
  })
}
