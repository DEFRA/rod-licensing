import { salesApi } from '@defra-fish/connectors-lib'

export default async (licensee) => {
  const contacts = await salesApi.contacts.getAll()
  const contact = contacts.filter(contact => contact.firstName === licensee.firstName &&
        contact.lastName === licensee.LastName &&
        contact.birthDate === licensee.birthDate &&
        contact.premises === licensee.premises &&
        contact.postcode === licensee.postcode)

  if (contact !== undefined) {
    licensee.preferredMethodOfConfirmation = contact.preferredMethodOfConfirmation
  } else {
    licensee.preferredMethodOfConfirmation = licensee.shortTermPreferredMethodOfConfirmation
  }
}
