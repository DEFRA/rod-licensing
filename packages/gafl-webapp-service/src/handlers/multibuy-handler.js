export const CheckMultibuy = async (request) => {
  const transaction = await request.cache().helpers.transaction.get()
  if (transaction.permissions.length > 0) {
    return true
  }
}
