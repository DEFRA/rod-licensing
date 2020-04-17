/**
 * This maps the functions to manipulate the transaction object to the pages
 */

import dateOfBirth from '../pages/contact/date-of-birth/update-transaction.js'
import benefitNiNumber from '../pages/concessions/benefit-ni-number/update-transaction.js'
import blueBadgeNumber from '../pages/concessions/blue-badge-number/update-transaction.js'

import licenceLength from '../pages/licence-details/licence-length/update-transaction.js'
import licenceType from '../pages/licence-details/licence-type/update-transaction.js'
import licenceToStart from '../pages/licence-details/licence-to-start/update-transaction.js'
import licenceStartDate from '../pages/licence-details/licence-start-date/update-transaction.js'
import licenceStartTime from '../pages/licence-details/licence-start-time/update-transaction.js'
import numberOfRods from '../pages/licence-details/number-of-rods/update-transaction.js'

import name from '../pages/contact/name/update-transaction.js'
import addressLookup from '../pages/contact/address/lookup/update-transaction.js'
import addressSelect from '../pages/contact/address/select/update-transaction.js'
import addressEntry from '../pages/contact/address/entry/update-transaction.js'
import contact from '../pages/contact/contact/update-transaction.js'
import newsletter from '../pages/contact/newsletter/update-transaction.js'

import {
  DATE_OF_BIRTH,
  LICENCE_TYPE,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_START_DATE,
  LICENCE_START_TIME,
  NUMBER_OF_RODS,
  BENEFIT_NI_NUMBER,
  BLUE_BADGE_NUMBER,
  NAME,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  ADDRESS_ENTRY,
  CONTACT,
  NEWSLETTER
} from '../constants.js'

export default {
  [NAME.page]: name,
  [DATE_OF_BIRTH.page]: dateOfBirth,
  [LICENCE_LENGTH.page]: licenceLength,
  [LICENCE_TYPE.page]: licenceType,
  [NUMBER_OF_RODS.page]: numberOfRods,
  [LICENCE_TO_START.page]: licenceToStart,
  [LICENCE_START_DATE.page]: licenceStartDate,
  [LICENCE_START_TIME.page]: licenceStartTime,
  [BENEFIT_NI_NUMBER.page]: benefitNiNumber,
  [BLUE_BADGE_NUMBER.page]: blueBadgeNumber,
  [ADDRESS_LOOKUP.page]: addressLookup,
  [ADDRESS_SELECT.page]: addressSelect,
  [ADDRESS_ENTRY.page]: addressEntry,
  [CONTACT.page]: contact,
  [NEWSLETTER.page]: newsletter,
  TransactionError: class TransactionError extends Error {}
}
