import { MAX_PERMISSIONS_PER_TRANSACTION } from '@defra-fish/business-rules-lib/src/constants.js'
import boom from '@hapi/boom'
import db from 'debug'

const debug = db('webapp:add-permission')

/**
 * Adds a new permission to the purchase
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const page = await request.cache().helpers.page.get()
  const status = await request.cache().helpers.status.get()
  const addressLookup = await request.cache().helpers.addressLookup.get()

  if (transaction.permissions.length >= MAX_PERMISSIONS_PER_TRANSACTION) {
    throw boom.badRequest('Too many permissions')
  }

  debug(`Add permission: ${transaction.permissions.length}`)
  transaction.permissions.push({ licensee: {} })
  page.permissions.push({})
  status.permissions.push({})
  addressLookup.permissions.push({})

  await request.cache().helpers.transaction.set(transaction)
  await request.cache().helpers.page.set(page)
  await request.cache().helpers.status.set(status)
  await request.cache().helpers.addressLookup.set(addressLookup)

  await request.cache().helpers.status.set({ currentPermissionIdx: transaction.permissions.length - 1 })
}
