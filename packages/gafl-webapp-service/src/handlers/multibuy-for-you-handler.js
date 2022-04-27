export const isMultibuyForYou = async request => {
  const transaction = await request.cache().helpers.transaction.get()

  if (transaction.permissions.length > 1 && transaction.permissions.isLicenceForYou) {
    return true
  }
  return false
}
