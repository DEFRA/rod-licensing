import licenceLength from '../pages/licence-details/licence-length/route.js'
import licenceType from '../pages/licence-details/licence-type/route.js'
import numberOfRods from '../pages/licence-details/number-of-rods/route.js'
import licenceToStart from '../pages/licence-details/licence-to-start/route.js'
import licenceStartDate from '../pages/licence-details/licence-start-date/route.js'
import licenceStartTime from '../pages/licence-details/licence-start-time/route.js'

import contactSummary from '../pages/summary/contact-summary/route.js'
import licenceSummary from '../pages/summary/licence-summary/route.js'

import dateOfBirth from '../pages/concessions/date-of-birth/route.js'
import noLicenceRequired from '../pages/licence-details/no-licence-required/route.js'
import juniorLicence from '../pages/concessions/junior-licence/route.js'
import benefitCheck from '../pages/concessions/benefit-check/route.js'
import benefitNINumber from '../pages/concessions/benefit-ni-number/route.js'
import blueBadgeCheck from '../pages/concessions/blue-badge-check/route.js'
import blueBadgeNumber from '../pages/concessions/blue-badge-number/route.js'

import name from '../pages/contact/name/route.js'
import addressLookup from '../pages/contact/address/lookup/route.js'
import addressSelect from '../pages/contact/address/select/route.js'
import addressEntry from '../pages/contact/address/entry/route.js'
import contact from '../pages/contact/contact/route.js'
import newsletter from '../pages/contact/newsletter/route.js'

import termsAndConditions from '../pages/terms-and-conditions/route.js'
import orderComplete from '../pages/order-complete/route.js'
import orderCompletePdf from '../pages/order-complete/pdf-route.js'
import paymentCancelled from '../pages/payment/cancelled/route.js'
import paymentFailed from '../pages/payment/failed/route.js'

import authenticate from '../pages/renewals/authenticate/route.js'

import staticAssets from './static-routes.js'
import miscRoutes from './misc-routes.js'

const routes = [
  ...staticAssets,
  ...miscRoutes,
  ...licenceLength,
  ...licenceType,
  ...numberOfRods,
  ...licenceToStart,
  ...licenceStartDate,
  ...licenceStartTime,
  ...dateOfBirth,
  ...noLicenceRequired,
  ...juniorLicence,
  ...benefitCheck,
  ...benefitNINumber,
  ...blueBadgeCheck,
  ...blueBadgeNumber,
  ...name,
  ...addressLookup,
  ...addressSelect,
  ...addressEntry,
  ...contact,
  ...newsletter,
  ...contactSummary,
  ...licenceSummary,
  ...termsAndConditions,
  ...paymentCancelled,
  ...paymentFailed,
  ...orderComplete,
  ...authenticate,
  orderCompletePdf
]

export default routes
