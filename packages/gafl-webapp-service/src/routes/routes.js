import licenceLength from '../pages/licence-details/licence-length/route.js'
import licenceType from '../pages/licence-details/licence-type/route.js'
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
import contact from '../pages/contact/contact/route.js'
import newsletter from '../pages/contact/newsletter/route.js'

import termsAndConditions from '../pages/terms-and-conditions/route.js'
import orderComplete from '../pages/order-complete/order-complete/route.js'
import licenceInformation from '../pages/order-complete/licence-information/route.js'
import paymentCancelled from '../pages/payment/cancelled/route.js'
import paymentFailed from '../pages/payment/failed/route.js'

import identify from '../pages/renewals/identify/route.js'
import invalidLink from '../pages/renewals/renewal-inactive/route.js'
import renewalStartDate from '../pages/renewals/renewal-start-date/route.js'

import staticAssets from './static-routes.js'
import miscRoutes from './misc-routes.js'
import telesalesRoutes from './telesales-routes.js'

const routes = [
  ...staticAssets,
  ...miscRoutes,
  ...licenceLength,
  ...licenceType,
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
  ...contact,
  ...newsletter,
  ...contactSummary,
  ...licenceSummary,
  ...termsAndConditions,
  ...paymentCancelled,
  ...paymentFailed,
  ...orderComplete,
  ...licenceInformation,
  ...identify,
  ...invalidLink,
  ...renewalStartDate
]

if (process.env.CHANNEL === 'telesales') {
  routes.push(...telesalesRoutes)
}

export default routes
