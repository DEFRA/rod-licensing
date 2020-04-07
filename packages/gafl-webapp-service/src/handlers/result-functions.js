/**
 * This maps the functions that determine the navigation in the journey definition to the pages
 */
import {
  DATE_OF_BIRTH,
  LICENCE_TYPE,
  LICENCE_TO_START,
  LICENCE_START_DATE,
  BENEFIT_CHECK,
  BLUE_BADGE_CHECK,
  ADDRESS_LOOKUP,
  CONTACT
} from '../constants.js'

import dateOfBirth from '../pages/concessions/date-of-birth/result-function.js'
import licenceType from '../pages/licence-details/licence-type/result-function.js'
import licenceToStart from '../pages/licence-details/licence-to-start/result-function.js'
import licenceStartDate from '../pages/licence-details/licence-start-date/result-function.js'
import benefitCheck from '../pages/concessions/benefit-check/result-function.js'
import blueBadgeCheck from '../pages/concessions/blue-badge-check/result-function.js'
import addressLookup from '../pages/contact/address/lookup/result-function.js'
import contact from '../pages/contact/contact/result-function.js'

/**
 * The result function determines the navigation in the route definition
 */
export default {
  [DATE_OF_BIRTH.page]: dateOfBirth,
  [LICENCE_TYPE.page]: licenceType,
  [LICENCE_TO_START.page]: licenceToStart,
  [LICENCE_START_DATE.page]: licenceStartDate,
  [BENEFIT_CHECK.page]: benefitCheck,
  [BLUE_BADGE_CHECK.page]: blueBadgeCheck,
  [ADDRESS_LOOKUP.page]: addressLookup,
  [CONTACT.page]: contact
}
