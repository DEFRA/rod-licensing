export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const transaction = await request.cache().helpers.transaction.get()

  let duplicateRemoved = false

  transaction.permissions = transaction.permissions.filter(item => {
    const isDuplicate =
      // item.licensee.firstName === permission.licensee.firstName &&
      item.licensee.lastName === permission.licensee.lastName &&
      item.isLicenceForYou === permission.isLicenceForYou &&
      item.licenceType === permission.licenceType &&
      item.numberOfRods === permission.numberOfRods &&
      item.licenceLength === permission.licenceLength &&
      item.licenceToStart === permission.licenceToStart &&
      item.permit.cost === permission.permit.cost

    if (isDuplicate && !duplicateRemoved) {
      duplicateRemoved = true
      return false
    }
    return true
  })

  await request.cache().helpers.transaction.set(transaction)
}
