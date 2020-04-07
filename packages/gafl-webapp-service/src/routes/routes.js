import licenceLength from '../pages/licence-details/licence-length/route.js'
import licenceType from '../pages/licence-details/licence-type/route.js'
import numberOfRods from '../pages/licence-details/number-of-rods/route.js'
import licenceToStart from '../pages/licence-details/licence-to-start/route.js'
import licenceStartDate from '../pages/licence-details/licence-start-date/route.js'
import licenceStartTime from '../pages/licence-details/licence-start-time/route.js'

import summary from '../pages/summary/route.js'

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

import controller from './controller-route.js'
import newTransactionRoute from './new-transaction-route.js'
import addPermissionRoute from './add-permission-route.js'
import staticAssets from './static-routes.js'
import miscRoutes from './misc-routes.js'
import error from '../pages/error/route.js'

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
  ...summary,
  ...error,
  controller,
  newTransactionRoute,
  addPermissionRoute
]

export default routes
