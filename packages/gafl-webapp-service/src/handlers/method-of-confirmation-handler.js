import { getExistingContacts } from '../../../sales-api-service/src/services/contacts.service.js'

export default async (request, permission) => {
  const existingLicensee = await getExistingContacts(permission.licensee)
  if (existingLicensee.length) {
    permission.licensee.preferredMethodOfConfirmation = existingLicensee[0].preferredMethodOfConfirmation
  } else {
    permission.licensee.preferredMethodOfConfirmation = permission.licensee.shortTermPreferredMethodOfConfirmation
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}
