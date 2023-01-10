/**
 * This maps the functions to manipulate the transaction object to the pages
 */

import dateOfBirth from '../pages/concessions/date-of-birth/update-transaction.js'
import disabilityConcession from '../pages/concessions/disability/update-transaction.js'

import licenceLength from '../pages/licence-details/licence-length/update-transaction.js'
import licenceType from '../pages/licence-details/licence-type/update-transaction.js'
import licenceFor from '../pages/licence-details/licence-for/update-transaction.js'
import licenceToStart from '../pages/licence-details/licence-to-start/update-transaction.js'
import licenceStartTime from '../pages/licence-details/licence-start-time/update-transaction.js'

import name from '../pages/contact/name/update-transaction.js'
import addressLookup from '../pages/contact/address/lookup/update-transaction.js'
import addressSelect from '../pages/contact/address/select/update-transaction.js'
import addressEntry from '../pages/contact/address/entry/update-transaction.js'
import contact from '../pages/contact/contact/update-transaction.js'
import licenceFulfilment from '../pages/contact/digital-licence/licence-fulfilment/update-transaction.js'
import licenceConfirmationMethod from '../pages/contact/digital-licence/licence-confirmation-method/update-transaction.js'
import newsletter from '../pages/contact/newsletter/update-transaction.js'

import removeLicence from '../pages/multibuy/remove-licence/update-transaction.js'

import paymentCancelled from '../pages/payment/cancelled/update-transaction.js'
import paymentFailed from '../pages/payment/failed/update-transaction.js'

import termsAndConditions from '../pages/terms-and-conditions/update-transaction.js'
import renewalInactive from '../pages/renewals/renewal-inactive/update-transaction.js'

import {
  DATE_OF_BIRTH,
  LICENCE_TYPE,
  LICENCE_FOR,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_START_TIME,
  DISABILITY_CONCESSION,
  NAME,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  ADDRESS_ENTRY,
  CONTACT,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  NEWSLETTER,
  REMOVE_LICENCE,
  TERMS_AND_CONDITIONS,
  PAYMENT_CANCELLED,
  PAYMENT_FAILED,
  RENEWAL_INACTIVE
} from '../uri.js'

export default {
  [DATE_OF_BIRTH.page]: dateOfBirth,
  [LICENCE_TO_START.page]: licenceToStart,
  [DISABILITY_CONCESSION.page]: disabilityConcession,
  [LICENCE_LENGTH.page]: licenceLength,
  [LICENCE_TYPE.page]: licenceType,
  [LICENCE_FOR.page]: licenceFor,
  [LICENCE_START_TIME.page]: licenceStartTime,
  [ADDRESS_LOOKUP.page]: addressLookup,
  [ADDRESS_SELECT.page]: addressSelect,
  [ADDRESS_ENTRY.page]: addressEntry,
  [NAME.page]: name,
  [CONTACT.page]: contact,
  [LICENCE_FULFILMENT.page]: licenceFulfilment,
  [LICENCE_CONFIRMATION_METHOD.page]: licenceConfirmationMethod,
  [NEWSLETTER.page]: newsletter,
  [REMOVE_LICENCE.page]: removeLicence,
  [TERMS_AND_CONDITIONS.page]: termsAndConditions,
  [PAYMENT_FAILED.page]: paymentFailed,
  [PAYMENT_CANCELLED.page]: paymentCancelled,
  [RENEWAL_INACTIVE.page]: renewalInactive
}
