'use strict'

export default {
  method: 'GET',
  path: '/buy/new',
  handler: async (request, h) => {
    await request.cache().initialize()
    return h.redirect('/buy')
  }
}
