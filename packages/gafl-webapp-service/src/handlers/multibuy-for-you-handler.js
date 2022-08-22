export const isMultibuyForYou = async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const { isLicenceForYou } = await request.cache().helpers.transaction.getCurrentPermission()

  return transaction.permissions.length > 1 && isLicenceForYou
}
