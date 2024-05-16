export const prepareContactMethodData = existingPermission => {
  const licenseeData = {}
  licenseeData.preferredMethodOfNewsletter = existingPermission.licensee.preferredMethodOfNewsletter.label
  licenseeData.preferredMethodOfConfirmation = existingPermission.licensee.preferredMethodOfConfirmation.label
  licenseeData.preferredMethodOfReminder = existingPermission.licensee.preferredMethodOfReminder.label

  return licenseeData
}
