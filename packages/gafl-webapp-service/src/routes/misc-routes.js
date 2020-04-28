import { CONTROLLER, FINALISED, NEW_TRANSACTION, ADD_PERMISSION, AGREED } from '../constants.js'
import finalisationHandler from '../handlers/finalisation-handler.js'
import addPermission from '../lib/add-permission.js'
import agreedHandler from '../handlers/agreed-handler.js'
import controllerHandler from '../handlers/controller-handler.js'

export default [
  {
    method: 'GET',
    path: '/',
    handler: async (request, h) => h.redirect(CONTROLLER.uri)
  },
  {
    method: 'GET',
    path: CONTROLLER.uri,
    handler: controllerHandler
  },
  {
    method: 'GET',
    path: AGREED.uri,
    handler: agreedHandler
  },
  {
    method: 'GET',
    path: FINALISED.uri,
    handler: finalisationHandler
  },
  {
    method: 'GET',
    path: NEW_TRANSACTION.uri,
    handler: async (request, h) => {
      await request.cache().initialize()
      return h.redirect(CONTROLLER.uri)
    }
  },
  {
    method: 'GET',
    path: ADD_PERMISSION.uri,
    handler: async (request, h) => {
      await addPermission(request)
      return h.redirect(CONTROLLER.uri)
    }
  }
]
