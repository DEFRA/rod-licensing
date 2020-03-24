'use strict'

import db from 'debug'
const debug = db('add-permission')

// TODO Ensure there is a hard limit here to prevent an attach on the redis cache
/**
 * A route to add a permission to the transaction for the multi-buy operation
 */
export default {
  method: 'GET',
  path: '/buy/add',
  handler: async (request, h) => {
    const transaction = await request.cache().get('transaction')
    transaction.permissions = transaction.permissions || []
    transaction.permissions.push({})
    debug(`Add permission: ${transaction.permissions.length}`)
    await request.cache().set('transaction', transaction)
    return h.redirect('/buy')
  }
}
