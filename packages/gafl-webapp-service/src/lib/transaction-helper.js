'use strict'

export default {
  hasPermission: async request => {
    const transaction = await request.cache().get('transaction')
    return !!(transaction && transaction.permissions)
  },
  setPermission: async (request, permission, idx) => {
    const transaction = await request.cache().get('transaction')
    const current = idx ? transaction.permissions[idx] : transaction.permissions[transaction.permissions.length - 1]
    Object.assign(current, permission)
    await request.cache().set('transaction', transaction)
  },
  getPermission: async (request, idx) => {
    const transaction = await request.cache().get('transaction')
    return idx ? transaction.permissions[idx] : transaction.permissions[transaction.permissions.length - 1]
  },
  TransactionError: class TransactionError extends Error {}
}
