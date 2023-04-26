export default async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const page = await request.cache().helpers.page.get()
  const status = await request.cache().helpers.status.get()
  const addressLookup = await request.cache().helpers.addressLookup.get()

  const transactionPermission = await request.cache().helpers.transaction.getCurrentPermission()
  const pagePermission = await request.cache().helpers.page.getCurrentPermission()
  const statusPermission = await request.cache().helpers.status.getCurrentPermission()
  const addressPermission = await request.cache().helpers.addressLookup.getCurrentPermission()

  transaction.permissions.splice(transactionPermission, 1)
  page.permissions.splice(pagePermission, 1)
  status.permissions.splice(statusPermission, 1)
  addressLookup.permissions.splice(addressPermission, 1)

  await request.cache().helpers.transaction.set(transaction)
  await request.cache().helpers.page.set(page)
  await request.cache().helpers.status.set(status)
  await request.cache().helpers.addressLookup.set(addressLookup)

  const lastStatusPermission = status.permissions[status.permissions.length - 1]
  await request.cache().helpers.status.setCurrentPermission(lastStatusPermission)
}
