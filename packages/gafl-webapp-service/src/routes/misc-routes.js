import {
  CONTROLLER,
  NEW_TRANSACTION,
  ADD_PERMISSION,
  AGREED,
  COOKIES,
  ACCESSIBILITY_STATEMENT,
  PRIVACY_POLICY,
  REFUND_POLICY
} from '../uri.js'
import addPermission from '../session-cache/add-permission.js'
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
  },
  {
    method: 'GET',
    path: COOKIES.uri,
    handler: async (request, h) => h.view(COOKIES.page)
  },
  {
    method: 'GET',
    path: ACCESSIBILITY_STATEMENT.uri,
    handler: async (request, h) => h.view(ACCESSIBILITY_STATEMENT.page)
  },
  {
    method: 'GET',
    path: PRIVACY_POLICY.uri,
    handler: async (request, h) => h.view(PRIVACY_POLICY.page)
  },
  {
    method: 'GET',
    path: REFUND_POLICY.uri,
    handler: async (request, h) => h.view(REFUND_POLICY.page)
  }
]
