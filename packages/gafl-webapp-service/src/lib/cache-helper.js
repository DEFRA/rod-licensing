/**
 * The three ares of the cache have each an array of permissions
 */
export default {
  hasPermission: async request => {
    const transaction = await request.cache().get('transaction')
    return !!transaction.permissions.length
  },
  setPermission: async (request, permission) => {
    const status = await request.cache().get('status')
    const idx = status.currentPermissionIdx
    const transaction = await request.cache().get('transaction')
    const current = transaction.permissions[idx]
    Object.assign(current, permission)
    await request.cache().set('transaction', transaction)
  },
  getPermission: async request => {
    const status = await request.cache().get('status')
    const idx = status.currentPermissionIdx
    const transaction = await request.cache().get('transaction')
    return transaction.permissions[idx]
  },
  setPageData: async (request, data) => {
    const status = await request.cache().get('status')
    const idx = status.currentPermissionIdx
    const page = await request.cache().get('page')
    const current = page.permissions[idx]
    Object.assign(current, data)
    await request.cache().set('page', page)
  },
  getPageData: async request => {
    const status = await request.cache().get('status')
    const idx = status.currentPermissionIdx
    const page = await request.cache().get('page')
    return page.permissions[idx]
  },
  setStatusData: async (request, data) => {
    const status = await request.cache().get('status')
    const idx = status.currentPermissionIdx
    const current = status.permissions[idx]
    Object.assign(current, data)
    await request.cache().set('status', status)
  },
  getStatusData: async request => {
    const status = await request.cache().get('status')
    const idx = status.currentPermissionIdx
    return status.permissions[idx]
  },
  TransactionError: class TransactionError extends Error {}
}
