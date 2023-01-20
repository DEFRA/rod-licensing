export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const transaction = await request.cache().helpers.transaction.get()

  transaction.permissions = transaction.permissions.filter(
    item =>
      item.licensee.firstName !== permission.licensee.firstName ||
      item.licensee.lastName !== permission.licensee.lastName ||
      item.isLicenceForYou !== permission.isLicenceForYou ||
      item.licenceType !== permission.licenceType ||
      item.licenceLength !== permission.licenceLength ||
      item.licenceToStart !== permission.licenceToStart ||
      item.permit.cost !== permission.permit.cost
  )

  await request.cache().helpers.transaction.set(transaction)
}
