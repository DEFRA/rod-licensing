'use strict'

import db from 'debug'
const debug = db('add-permission')

export default {
  method: 'GET',
  path: '/buy/add',
  handler: async (request, h) => {
    debug('Add permission')
    const transaction = await request.cache().get('transaction')
    transaction.permissions = transaction.permissions || []
    transaction.permissions.push({})
    await request.cache().set('transaction', transaction)
    return h.redirect('/buy')
  }
}
