import { salesApi } from '@defra-fish/connectors-lib'

export default async (request, permission) => {
  const existingLicensee = salesApi.contacts.find({
    firstName: permission.licensee.firstName,
    lastName: permission.licensee.lastName,
    birthDate: permission.licensee.birthDate,
    premises: permission.licensee.premises,
    postcode: permission.licensee.postcode
  })

  if (existingLicensee !== undefined) {
    permission.licensee.preferredMethodOfConfirmation = existingLicensee.preferredMethodOfConfirmation
  } else {
    console.log(permission)
    permission.licensee.preferredMethodOfConfirmation = permission.licensee.shortTermPreferredMethodOfConfirmation
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}
