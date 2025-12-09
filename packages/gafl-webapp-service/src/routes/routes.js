import licenceLength from '../pages/licence-details/licence-length/route.js'
import licenceType from '../pages/licence-details/licence-type/route.js'
import licenceFor from '../pages/licence-details/licence-for/route.js'
import licenceToStart from '../pages/licence-details/licence-to-start/route.js'
import licenceStartTime from '../pages/licence-details/licence-start-time/route.js'

import contactSummary from '../pages/summary/contact-summary/route.js'
import licenceSummary from '../pages/summary/licence-summary/route.js'

import dateOfBirth from '../pages/concessions/date-of-birth/route.js'
import noLicenceRequired from '../pages/licence-details/no-licence-required/route.js'
import disabilityConcession from '../pages/concessions/disability/route.js'

import name from '../pages/contact/name/route.js'
import addressLookup from '../pages/contact/address/lookup/route.js'
import addressSelect from '../pages/contact/address/select/route.js'
import addressEntry from '../pages/contact/address/entry/route.js'
import licenceFulfilment from '../pages/contact/digital-licence/licence-fulfilment/route.js'
import licenceConfirmationMethod from '../pages/contact/digital-licence/licence-confirmation-method/route.js'
import checkConfirmationContact from '../pages/contact/digital-licence/check-confirmation-contact/route.js'
import contact from '../pages/contact/contact/route.js'
import newsletter from '../pages/contact/newsletter/route.js'

import termsAndConditions from '../pages/terms-and-conditions/route.js'
import orderComplete from '../pages/order-complete/order-complete/route.js'
import licenceDetails from '../pages/order-complete/licence-details/route.js'
import paymentCancelled from '../pages/payment/cancelled/route.js'
import paymentFailed from '../pages/payment/failed/route.js'

import identify from '../pages/renewals/identify/route.js'
import invalidLink from '../pages/renewals/renewal-inactive/route.js'
import renewalStartDate from '../pages/renewals/renewal-start-date/route.js'
import licenceNotFound from '../pages/renewals/licence-not-found/route.js'

import staticAssets from './static-routes.js'
import miscRoutes from './misc-routes.js'
import telesalesRoutes from './telesales-routes.js'
import errorRoutes from './error-routes.js'
import errorTestRoutes from './error-test-routes.js'

import choosePayment from '../pages/recurring-payments/choose-payment/route.js'
import setUpRecurring from '../pages/recurring-payments/set-up-payment/route.js'

import cancelRPIdentify from '../pages/recurring-payments/cancel/identify/route.js'
import cancelRPDetails from '../pages/recurring-payments/cancel/details/route.js'
import cancelRPConfirm from '../pages/recurring-payments/cancel/confirm/route.js'
import cancelRPComplete from '../pages/recurring-payments/cancel/complete/route.js'
import cancelRPAgreementNotFound from '../pages/recurring-payments/cancel/agreement-not-found/route.js'
import cancelRPAlreadyCancelled from '../pages/recurring-payments/cancel/already-cancelled/route.js'

const routes = [
  ...staticAssets,
  ...miscRoutes,
  ...licenceLength,
  ...licenceType,
  ...licenceFor,
  ...licenceToStart,
  ...licenceStartTime,
  ...dateOfBirth,
  ...noLicenceRequired,
  ...disabilityConcession,
  ...name,
  ...addressLookup,
  ...addressSelect,
  ...addressEntry,
  ...licenceFulfilment,
  ...licenceConfirmationMethod,
  ...checkConfirmationContact,
  ...contact,
  ...newsletter,
  ...contactSummary,
  ...licenceSummary,
  ...termsAndConditions,
  ...paymentCancelled,
  ...paymentFailed,
  ...orderComplete,
  ...licenceDetails,
  ...identify,
  ...invalidLink,
  ...renewalStartDate,
  ...choosePayment,
  ...setUpRecurring,
  ...licenceNotFound,
  ...cancelRPIdentify,
  ...cancelRPDetails,
  ...cancelRPConfirm,
  ...cancelRPComplete,
  ...cancelRPAgreementNotFound,
  ...cancelRPAlreadyCancelled
]

if (process.env.CHANNEL === 'telesales') {
  routes.push(...telesalesRoutes)
}

if (process.env.ERROR_PAGE_ROUTE === 'true') {
  routes.push(...errorRoutes)
}

if (process.env.ERROR_PAGE_ROUTE === 'true') {
  routes.push(...errorTestRoutes)
}

export default routes
