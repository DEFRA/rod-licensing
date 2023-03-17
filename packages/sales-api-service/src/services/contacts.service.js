import { Contact, findByExample, findById, generateDobId } from '@defra-fish/dynamics-lib'
import { getGlobalOptionSetValue } from './reference-data.service.js'
import db from 'debug'
const debug = db('sales:transformers')

/**
 * Transform a contact payload into a {@link Contact} entity.  Attempts to resolve an existing contact record for either the given id
 * or based on a lookup against the data in certain fields.
 *
 * @typedef ContactPayload
 * @property {string} [id] The id of an existing contact record. If present the existing record for the given id will be retrieved and updated.
 * @property {!string} firstName The first name of the contact
 * @property {!string} lastName The last name of the contact
 * @property {!string} birthDate The date of birth for the contact
 * @property {string} email The email address of the contact
 * @property {string} mobilePhone The mobile phone number of the contact
 * @property {string} organisation The organisation for the contact's address
 * @property {!string} premises The premises for the contact's address
 * @property {string} street The street for the contact's address
 * @property {string} locality The locality for the contact's address
 * @property {string} town The town for the contact's address
 * @property {!string} postcode The postcode for the contact's address
 * @property {!string} country The country for the contact's address
 * @property {!string} preferredMethodOfConfirmation The preferred method for confirmation communications
 * @property {!string} preferredMethodOfNewsletter The preferred method for newsletter communications
 * @property {!string} preferredMethodOfReminder The preferred method for reminder communications
 *
 * @param {!ContactPayload} payload The payload to be transformed
 * @returns {Promise<Contact>}
 */
export const resolveContactPayload = async (permission, payload) => {
  const { id, country, preferredMethodOfConfirmation, preferredMethodOfNewsletter, preferredMethodOfReminder, ...primitives } = payload

  const contactInCRM = await findContactInCRM(payload)
  const contact = Object.assign(contactInCRM || new Contact(), primitives)

  contact.preferredMethodOfReminder = await getGlobalOptionSetValue(
    Contact.definition.mappings.preferredMethodOfReminder.ref,
    preferredMethodOfReminder
  )
  contact.preferredMethodOfNewsletter = await getGlobalOptionSetValue(
    Contact.definition.mappings.preferredMethodOfNewsletter.ref,
    preferredMethodOfNewsletter
  )
  contact.shortTermPreferredMethodOfConfirmation = await getGlobalOptionSetValue(
    Contact.definition.mappings.shortTermPreferredMethodOfConfirmation.ref,
    preferredMethodOfConfirmation
  )

  if (permission.licenceLength !== '12M' && contactInCRM) {
    contact.preferredMethodOfConfirmation = await getGlobalOptionSetValue(
      Contact.definition.mappings.preferredMethodOfConfirmation.ref,
      contactInCRM.preferredMethodOfConfirmation.description
    )
  } else {
    contact.preferredMethodOfConfirmation = await getGlobalOptionSetValue(
      Contact.definition.mappings.shortTermPreferredMethodOfConfirmation.ref,
      preferredMethodOfConfirmation
    )
  }

  contact.country = await getGlobalOptionSetValue(Contact.definition.mappings.country.ref, country)

  return contact
}

export const getObfuscatedDob = async licensee => {
  const contactInCRM = await findContactInCRM(licensee)
  return contactInCRM?.obfuscatedDob ? contactInCRM.obfuscatedDob : generateDobId(licensee.birthDate)
}

const findContactInCRM = async licensee => {
  let contact
  if (licensee.id) {
    // Resolve an existing contact id
    contact = await findById(Contact, licensee.id)
    debug('Resolved existing contact record for id=%s - exists=%s', licensee.id, contact !== null)
  } else {
    const lookup = new Contact()
    lookup.firstName = licensee.firstName
    lookup.lastName = licensee.lastName
    lookup.birthDate = licensee.birthDate
    lookup.premises = licensee.premises
    lookup.postcode = licensee.postcode

    const candidates = await findByExample(lookup)
    if (candidates.length) {
      debug('Resolved %d candidate contacts for contact %o', candidates.length, lookup)
      contact = candidates[0]
    }
  }
  return contact
}
