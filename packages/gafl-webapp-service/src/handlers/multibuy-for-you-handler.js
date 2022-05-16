export const isMultibuyForYou = async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const { isLicenceForYou } = await request.cache().helpers.transaction.getCurrentPermission()

  if (transaction.permissions.length > 1 && isLicenceForYou) {
    return true
  }
  return false
}
