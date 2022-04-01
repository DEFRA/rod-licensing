export const CheckMultibuyForYou = async request => {
  const transaction = await request.cache().helpers.transaction.get()

  if (transaction.permissions.length > 0 && transaction.permissions.isLicenceForYou) {
    return true
  }
  return false
}
