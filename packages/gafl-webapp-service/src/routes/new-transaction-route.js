import { CONTROLLER, NEW_TRANSACTION } from '../constants.js'

export default {
  method: 'GET',
  path: NEW_TRANSACTION.uri,
  handler: async (request, h) => {
    await request.cache().initialize()
    return h.redirect(CONTROLLER.uri)
  }
}
