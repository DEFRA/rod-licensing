import { CONTROLLER, ADD_PERMISSION, MAX_PERMISSIONS } from '../constants.js'
import db from 'debug'
import boom from '@hapi/boom'
const debug = db('add-permission')

/**
 * A route to add a permission to the transaction for the multi-buy operation
 */
export default {
  method: 'GET',
  path: ADD_PERMISSION.uri,
  handler: async (request, h) => {
    const transaction = await request.cache().helpers.transaction.get()
    const page = await request.cache().helpers.page.get()
    const status = await request.cache().helpers.status.get('page')
    if (transaction.permissions.length >= MAX_PERMISSIONS) {
      throw boom.badRequest('Too many permissions')
    }
    debug(`Add permission: ${transaction.permissions.length}`)
    transaction.permissions.push({})
    page.permissions.push({})
    status.permissions.push({})
    await request.cache().helpers.transaction.set(transaction)
    await request.cache().helpers.page.set(page)
    await request.cache().helpers.status.set(status)
    await request.cache().helpers.status.set({ currentPermissionIdx: transaction.permissions.length - 1 })
    return h.redirect(CONTROLLER.uri)
  }
}
