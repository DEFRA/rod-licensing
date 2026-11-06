
export default async request => {
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  // there is no additional payload to update the transaction with
  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}
