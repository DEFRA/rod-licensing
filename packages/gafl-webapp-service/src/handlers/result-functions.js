/**
 * This maps the functions that determine the navigation in the journey definition to the pages
 */
import {
  DATE_OF_BIRTH,
  JUNIOR_LICENCE,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  NUMBER_OF_RODS,
  LICENCE_TO_START,
  LICENCE_START_DATE,
  LICENCE_START_TIME,
  BENEFIT_CHECK,
  BENEFIT_NI_NUMBER,
  BLUE_BADGE_CHECK,
  BLUE_BADGE_NUMBER,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  ADDRESS_ENTRY,
  CONTACT,
  LICENCE_SUMMARY,
  NAME
} from '../uri.js'

import dateOfBirth from '../pages/contact/date-of-birth/result-function.js'
import junior from '../pages/concessions/junior-licence/result-function.js'
import licenceType from '../pages/licence-details/licence-type/result-function.js'
import licenceLength from '../pages/licence-details/licence-length/result-function.js'
import numberOfRods from '../pages/licence-details/number-of-rods/result-function.js'
import licenceToStart from '../pages/licence-details/licence-to-start/result-function.js'
import licenceStartDate from '../pages/licence-details/licence-start-date/result-function.js'
import licenceStartTime from '../pages/licence-details/licence-start-time/result-function.js'
import benefitCheck from '../pages/concessions/benefit-check/result-function.js'
import benefitNiNumber from '../pages/concessions/benefit-ni-number/result-function.js'
import blueBadgeCheck from '../pages/concessions/blue-badge-check/result-function.js'
import blueBadgeNumber from '../pages/concessions/blue-badge-number/result-function.js'
import contact from '../pages/contact/contact/result-function.js'
import name from '../pages/contact/name/result-function.js'
import addressLookup from '../pages/contact/address/lookup/result-function.js'
import addressSelect from '../pages/contact/address/select/result-function.js'
import addressEntry from '../pages/contact/address/entry/result-function.js'
import licenceSummary from '../pages/summary/licence-summary/result-function.js'

/**
 * The result function determines the navigation in the route definition
 */
export default {
  [DATE_OF_BIRTH.page]: dateOfBirth,
  [JUNIOR_LICENCE.page]: junior,
  [LICENCE_LENGTH.page]: licenceLength,
  [LICENCE_TYPE.page]: licenceType,
  [NUMBER_OF_RODS.page]: numberOfRods,
  [LICENCE_TO_START.page]: licenceToStart,
  [LICENCE_START_DATE.page]: licenceStartDate,
  [LICENCE_START_TIME.page]: licenceStartTime,
  [BENEFIT_CHECK.page]: benefitCheck,
  [BENEFIT_NI_NUMBER.page]: benefitNiNumber,
  [BLUE_BADGE_CHECK.page]: blueBadgeCheck,
  [BLUE_BADGE_NUMBER.page]: blueBadgeNumber,
  [ADDRESS_LOOKUP.page]: addressLookup,
  [ADDRESS_ENTRY.page]: addressEntry,
  [ADDRESS_SELECT.page]: addressSelect,
  [CONTACT.page]: contact,
  [NAME.page]: name,
  [LICENCE_SUMMARY.page]: licenceSummary
}
