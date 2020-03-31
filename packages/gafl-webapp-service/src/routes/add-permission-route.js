import { CONTROLLER, ADD_PERMISSION } from '../constants.js'
import addPermission from '../lib/add-permission.js'

/**
 * A route to add a permission to the transaction for the multi-buy operation
 */
export default {
  method: 'GET',
  path: ADD_PERMISSION.uri,
  handler: async (request, h) => {
    await addPermission(request)
    return h.redirect(CONTROLLER.uri)
  }
}
