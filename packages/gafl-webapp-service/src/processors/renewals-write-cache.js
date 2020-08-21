import moment from 'moment-timezone'
import db from 'debug'
import { LICENCE_TYPE, NAME, ADDRESS_ENTRY, CONTACT } from '../uri.js'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import * as constants from './mapping-constants.js'
import { ageConcessionHelper, addDisabled } from './concession-helper.js'
import { CONTACT_SUMMARY_SEEN } from '../constants.js'
import { licenceToStart } from '../pages/licence-details/licence-to-start/update-transaction.js'
import { licenseTypes } from '../pages/licence-details/licence-type/route.js'
import { salesApi } from '@defra-fish/connectors-lib'

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

  const endDateMoment = moment.utc(authenticationResult.permission.endDate).tz(SERVICE_LOCAL_TIME)

  const renewedHasExpired = !endDateMoment.isAfter()

  permission.licenceToStart = renewedHasExpired ? licenceToStart.AFTER_PAYMENT : licenceToStart.ANOTHER_DATE
  permission.licenceStartDate = renewedHasExpired ? moment().format('YYYY-MM-DD') : endDateMoment.format('YYYY-MM-DD')
  permission.licenceStartTime = renewedHasExpired ? 0 : endDateMoment.hours()
  permission.renewedEndDate = endDateMoment.toISOString()
  permission.renewedHasExpired = renewedHasExpired
  permission.licensee = Object.assign(
    (({ country, preferredMethodOfConfirmation, preferredMethodOfNewsletter, preferredMethodOfReminder, ...l }) => l)(
      authenticationResult.permission.licensee
    ),
    {
      countryCode: 'GB'
    }
  )

  // Delete any licensee objects which are null
  Object.entries(permission.licensee)
    .filter(e => !e[1])
    .map(e => e[0])
    .forEach(k => delete permission.licensee[k])

  permission.licensee.preferredMethodOfNewsletter = authenticationResult.permission.licensee.preferredMethodOfNewsletter.label
  permission.licensee.preferredMethodOfConfirmation = authenticationResult.permission.licensee.preferredMethodOfConfirmation.label
  permission.licensee.preferredMethodOfReminder = authenticationResult.permission.licensee.preferredMethodOfReminder.label

  // Add in concession proofs
  const concessions = await salesApi.concessions.getAll()
  authenticationResult.permission.concessions.forEach(concessionProof => {
    const concessionReference = concessions.find(c => c.id === concessionProof.id)
    if (concessionReference && concessionReference.name === constants.CONCESSION.DISABLED) {
      addDisabled(permission, concessionProof.proof.type.label, concessionProof.proof.referenceNumber)
    }
  })

  // Add appropriate age concessions
  ageConcessionHelper(permission)
  await request.cache().helpers.transaction.setCurrentPermission(permission)
  await request.cache().helpers.status.setCurrentPermission({ renewal: true, fromSummary: CONTACT_SUMMARY_SEEN })
}

export const setUpPayloads = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  const type = () => {
    if (permission.licenceType === constants.LICENCE_TYPE['trout-and-coarse']) {
      if (permission.numberOfRods === '2') {
        return licenseTypes.troutAndCoarse2Rod
      } else {
        return licenseTypes.troutAndCoarse3Rod
      }
    }
    return licenseTypes.salmonAndSeaTrout
  }

  await request.cache().helpers.page.setCurrentPermission(LICENCE_TYPE.page, {
    payload: {
      'licence-type': type()
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
