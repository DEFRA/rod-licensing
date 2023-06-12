import { hasDuplicates } from '../../../processors/multibuy-processor.js'

export default async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const page = await request.cache().helpers.page.get()
  const status = await request.cache().helpers.status.get()
  const addressLookup = await request.cache().helpers.addressLookup.get()

  const transactionPermission = await request.cache().helpers.transaction.getCurrentPermission()
  const addressPermission = await request.cache().helpers.addressLookup.getCurrentPermission()

  page.permissions = page.permissions.filter(item => Object.keys(item).includes('remove-licence') !== true)
  status.permissions = status.permissions.filter(item => Object.keys(item).includes('remove-licence') !== true)
  const addressFiltered = removeDuplicates(addressLookup, addressPermission)

  await request.cache().helpers.page.set(page)
  await request.cache().helpers.status.set(status)
  await request.cache().helpers.addressLookup.set(addressFiltered)

  const duplicates = await hasDuplicates(transaction.permissions)

  if (duplicates) {
    const transactionFiltered = removeDuplicates(transaction, transactionPermission)
    await request.cache().helpers.transaction.set(transactionFiltered)
  } else {
    transaction.permissions = transaction.permissions.filter(item => item.hash !== transactionPermission.hash)
    await request.cache().helpers.transaction.set(transaction)
  }

  const updatedTransaction = await request.cache().helpers.transaction.get()

  if (updatedTransaction.permissions.length > 0) {
    const lastStatusPermission = status.permissions[status.permissions.length - 1]
    await request.cache().helpers.status.set({ currentPermissionIdx: updatedTransaction.permissions.length - 1 })
    await request.cache().helpers.status.setCurrentPermission(lastStatusPermission)
  }
}

const removeDuplicates = (item, permission) => {
  const filter = { ...item }
  for (let idx = 0; idx < item.permissions.length; idx++) {
    if (JSON.stringify(item.permissions[idx]) === JSON.stringify(permission)) {
      filter.permissions.splice(idx, 1)
      break
    }
  }
  return filter
}
