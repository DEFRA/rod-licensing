import { OIDC_SIGNIN, OIDC_ACCOUNT_DISABLED, OIDC_ROLE_REQUIRED, CONTROLLER } from '../uri.js'
import { signIn } from '../handlers/oidc-handler.js'

export default [
  {
    method: ['POST'],
    path: OIDC_SIGNIN.uri,
    handler: signIn,
    options: {
      auth: false,
      plugins: {
        crumb: false
      }
    }
  },
  {
    method: ['GET'],
    path: OIDC_ACCOUNT_DISABLED.uri,
    handler: async (request, h) => h.view(OIDC_ACCOUNT_DISABLED.page, { uri: { buy: CONTROLLER.uri } }),
    options: { auth: false }
  },
  {
    method: ['GET'],
    path: OIDC_ROLE_REQUIRED.uri,
    handler: async (request, h) => h.view(OIDC_ROLE_REQUIRED.page, { uri: { buy: CONTROLLER.uri } }),
    options: { auth: false }
  }
]
