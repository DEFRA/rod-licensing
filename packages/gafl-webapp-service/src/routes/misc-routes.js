import {
  CONTROLLER,
  NEW_TRANSACTION,
  ADD_PERMISSION,
  AGREED,
  COOKIES,
  ACCESSIBILITY_STATEMENT,
  PRIVACY_POLICY,
  REFUND_POLICY,
  AUTHENTICATE,
  RENEWAL_START_VALIDATE,
  RENEWAL_PUBLIC,
  IDENTIFY,
  OS_TERMS,
  ATTRIBUTION
} from '../uri.js'

import { SESSION_COOKIE_NAME_DEFAULT, CSRF_TOKEN_COOKIE_NAME_DEFAULT, ALB_COOKIE_NAME, ALBCORS_COOKIE_NAME } from '../constants.js'

import addPermission from '../session-cache/add-permission.js'
import agreedHandler from '../handlers/agreed-handler.js'
import controllerHandler from '../handlers/controller-handler.js'
import authenticationHandler from '../handlers/authentication-handler.js'
import renewalValidationHandler from '../handlers/renewal-start-date-validation-handler.js'
import attribution from '../handlers/attribution-handler.js'

const simpleView = view => ({
  method: 'GET',
  path: view.uri,
  handler: async (request, h) => h.view(view.page)
})

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
    path: AUTHENTICATE.uri,
    handler: authenticationHandler
  },
  {
    method: 'GET',
    path: RENEWAL_PUBLIC.uri,
    handler: async (request, h) => {
      await request.cache().initialize()
      await addPermission(request)
      if (request.params.referenceNumber) {
        await request.cache().helpers.status.setCurrentPermission({ referenceNumber: request.params.referenceNumber })
      }
      return h.redirect(IDENTIFY.uri)
    }
  },
  {
    method: 'GET',
    path: RENEWAL_START_VALIDATE.uri,
    handler: renewalValidationHandler
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
    handler: async (request, h) =>
      h.view(COOKIES.page, {
        uri: {
          buy: CONTROLLER.uri
        },
        cookie: {
          csrf: process.env.CSRF_TOKEN_COOKIE_NAME || CSRF_TOKEN_COOKIE_NAME_DEFAULT,
          sess: process.env.SESSION_COOKIE_NAME || SESSION_COOKIE_NAME_DEFAULT,
          alb: ALB_COOKIE_NAME,
          albcors: ALBCORS_COOKIE_NAME
        }
      })
  },
  {
    method: 'GET',
    path: ATTRIBUTION.uri,
    handler: attribution
  },
  simpleView(ACCESSIBILITY_STATEMENT),
  simpleView(PRIVACY_POLICY),
  simpleView(REFUND_POLICY),
  simpleView(OS_TERMS)
]
