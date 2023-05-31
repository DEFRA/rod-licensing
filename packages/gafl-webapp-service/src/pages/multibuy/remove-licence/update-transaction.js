import { hasDuplicates } from '../../../processors/multibuy-processor.js'

export default async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const page = await request.cache().helpers.page.get()
  const status = await request.cache().helpers.status.get()
  const addressLookup = await request.cache().helpers.addressLookup.get()

  const transactionPermission = await request.cache().helpers.transaction.getCurrentPermission()
  const addressPermission = await request.cache().helpers.addressLookup.getCurrentPermission()

  const duplicate = await hasDuplicates(transaction.permissions)

  if (duplicate) {
    removeDuplicates(transaction.permissions, transactionPermission)
  } else {
    transaction.permissions = transaction.permissions.filter(item => item.hash !== transactionPermission.hash)
  }

  page.permissions = page.permissions.filter(item => Object.keys(item).includes('remove-licence') !== true)
  status.permissions = status.permissions.filter(item => Object.keys(item).includes('remove-licence') !== true)
  removeDuplicates(addressLookup.permissions, addressPermission)

  await request.cache().helpers.transaction.set(transaction)
  await request.cache().helpers.page.set(page)
  await request.cache().helpers.status.set(status)
  await request.cache().helpers.addressLookup.set(addressLookup)

  const lastStatusPermission = status.permissions[status.permissions.length - 1]
  await request.cache().helpers.status.set({ currentPermissionIdx: transaction.permissions.length - 1 })
  await request.cache().helpers.status.setCurrentPermission(lastStatusPermission)
}

const removeDuplicates = async (permissions, currentPermission) => {
  for (let permission = 0; permission < permissions.length; permission++) {
    if (JSON.stringify(permissions[permission]) === JSON.stringify(currentPermission)) {
      permissions.splice(permission, 1)
      break
    }
  }
}
