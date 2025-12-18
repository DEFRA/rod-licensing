import { OIDC_SIGNIN, OIDC_ACCOUNT_DISABLED, OIDC_ROLE_REQUIRED, CONTROLLER } from '../uri.js'
import { signIn } from '../handlers/oidc-handler.js'
import cancelRPIdentify from '../pages/recurring-payments/cancel/identify/route.js'
import cancelRPDetails from '../pages/recurring-payments/cancel/details/route.js'
import cancelRPConfirm from '../pages/recurring-payments/cancel/confirm/route.js'
import cancelRPComplete from '../pages/recurring-payments/cancel/complete/route.js'
import cancelRPAgreementNotFound from '../pages/recurring-payments/cancel/agreement-not-found/route.js'
import cancelRPLicenceNotFound from '../pages/recurring-payments/cancel/licence-not-found/route.js'
import cancelRPAlreadyCancelled from '../pages/recurring-payments/cancel/already-cancelled/route.js'

const telesalesRoutes = [
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

if (process.env.SHOW_CANCELLATION_JOURNEY === 'true') {
  telesalesRoutes.push(
    ...cancelRPIdentify,
    ...cancelRPDetails,
    ...cancelRPConfirm,
    ...cancelRPComplete,
    ...cancelRPAgreementNotFound,
    ...cancelRPLicenceNotFound,
    ...cancelRPAlreadyCancelled
  )
}
export default telesalesRoutes
