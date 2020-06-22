import moment from 'moment'
import * as concessionHelper from './concession-helper.js'
import db from 'debug'
import { LICENCE_TYPE, NUMBER_OF_RODS, RENEWAL_START_DATE, NAME, ADDRESS_ENTRY, CONTACT } from '../uri.js'
import * as constants from './mapping-constants.js'
const debug = db('webapp:renewals-write-cache')

/**
 * Module is used for easy renewals where the data is read from the CRM and written into the session
 * cache.
 */
export const setUpCacheFromAuthenticationResult = async (request, authenticationResult) => {
  debug(`Set up cache from authentication result for renewal of ${authenticationResult.permission.referenceNumber}`)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  permission.licenceLength = '12M' // Always for easy renewals
  permission.licenceType = authenticationResult.permission.permit.permitSubtype.label
  permission.numberOfRods = authenticationResult.permission.permit.numberOfRods.toString()
  permission.licenceStartTime = null
  permission.licenceToStart = 'another-date-or-time'
  permission.licenceStartDate = moment(authenticationResult.permission.endDate).format('YYYY-MM-DD')
  permission.renewedEndDate = permission.licenceStartDate
  permission.licensee = Object.assign((({
    country,
    preferredMethodOfConfirmation,
    preferredMethodOfNewsletter,
    preferredMethodOfReminder,
    ...l
  }) => l)(authenticationResult.permission.licensee), {
    countryCode: 'GB'
  })

  permission.licensee.preferredMethodOfNewsletter = authenticationResult
    .permission.licensee.preferredMethodOfNewsletter.label
  permission.licensee.preferredMethodOfConfirmation = authenticationResult
    .permission.licensee.preferredMethodOfConfirmation.label
  permission.licensee.preferredMethodOfReminder = authenticationResult
    .permission.licensee.preferredMethodOfReminder.label

  // Add in concession proofs
  authenticationResult.permission.concessions.forEach(c => {
    concessionHelper.addDisabled(permission, c.proofType.label, c.referenceNumber)
  })

  await request.cache().helpers.transaction.setCurrentPermission(permission)
  await request.cache().helpers.status.setCurrentPermission({ renewal: true, fromSummary: 'contact-summary' })
}

export const setUpPayloads = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  await request.cache().helpers.page.setCurrentPermission(LICENCE_TYPE.page, {
    payload: {
      'licence-type': Object.entries(constants.LICENCE_TYPE)
        .find(e => e[1] === permission.licenceType)[0]
    }
  })

  await request.cache().helpers.page.setCurrentPermission(NUMBER_OF_RODS.page, {
    payload: {
      'number-of-rods': permission.numberOfRods
    }
  })

  await request.cache().helpers.page.setCurrentPermission(RENEWAL_START_DATE.page, {
    payload: {
      'licence-start-date-day': moment(permission.licenceStartDate).date().toString(),
      'licence-start-date-month': (moment(permission.licenceStartDate).month() + 1).toString(),
      'licence-start-date-year': moment(permission.licenceStartDate).year().toString()
    }
  })

  await request.cache().helpers.page.setCurrentPermission(NAME.page, {
    payload: {
      'first-name': permission.licensee.firstName,
      'last-name': permission.licensee.lastName
    }
  })

  await request.cache().helpers.page.setCurrentPermission(ADDRESS_ENTRY.page, {
    payload: {
      premises: permission.licensee.premises,
      street: permission.licensee.street,
      locality: permission.licensee.locality,
      town: permission.licensee.town,
      postcode: permission.licensee.postcode,
      'country-code': permission.licensee.countryCode
    }
  })

  await request.cache().helpers.page.setCurrentPermission(CONTACT.page, {
    payload: (l => {
      switch (l.preferredMethodOfConfirmation) {
        case constants.HOW_CONTACTED.email:
          return { 'how-contacted': 'email', email: l.email }
        case constants.HOW_CONTACTED.text:
          return { 'how-contacted': 'text', text: l.mobilePhone }
        case constants.HOW_CONTACTED.letter:
          return { 'how-contacted': 'none' }
        default:
          return { 'how-contacted': 'none' }
      }
    })(permission.licensee)
  })
}
