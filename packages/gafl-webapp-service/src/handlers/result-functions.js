/**
 * This maps the functions that determine the navigation in the journey definition to the pages
 */
import {
  DATE_OF_BIRTH,
  LICENCE_TO_START,
  DISABILITY_CONCESSION,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  LICENCE_START_TIME,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  ADDRESS_ENTRY,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  CONTACT,
  LICENCE_SUMMARY,
  NAME
} from '../uri.js'

import dateOfBirth from '../pages/concessions/date-of-birth/result-function.js'
import licenceToStart from '../pages/licence-details/licence-to-start/result-function.js'
import disabilityConcession from '../pages/concessions/disability/result-function.js'
import licenceType from '../pages/licence-details/licence-type/result-function.js'
import licenceLength from '../pages/licence-details/licence-length/result-function.js'
import licenceStartTime from '../pages/licence-details/licence-start-time/result-function.js'
import contact from '../pages/contact/contact/result-function.js'
import licenceFulfilment from '../pages/contact/digital-licence/licence-fulfilment/result-function.js'
import licenceConfirmationMethod from '../pages/contact/digital-licence/licence-confirmation-method/result-function.js'
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
  [LICENCE_TO_START.page]: licenceToStart,
  [DISABILITY_CONCESSION.page]: disabilityConcession,
  [LICENCE_LENGTH.page]: licenceLength,
  [LICENCE_TYPE.page]: licenceType,
  [LICENCE_START_TIME.page]: licenceStartTime,
  [ADDRESS_LOOKUP.page]: addressLookup,
  [ADDRESS_ENTRY.page]: addressEntry,
  [ADDRESS_SELECT.page]: addressSelect,
  [CONTACT.page]: contact,
  [LICENCE_FULFILMENT.page]: licenceFulfilment,
  [LICENCE_CONFIRMATION_METHOD.page]: licenceConfirmationMethod,
  [NAME.page]: name,
  [LICENCE_SUMMARY.page]: licenceSummary
}
