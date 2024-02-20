import moment from 'moment-timezone'
import db from 'debug'
import { LICENCE_TYPE, NAME, ADDRESS_LOOKUP, CONTACT, LICENCE_FULFILMENT, LICENCE_CONFIRMATION_METHOD } from '../uri.js'
import { addDisabled, ageConcessionHelper, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import * as constants from './mapping-constants.js'
import { licenceToStart } from '../pages/licence-details/licence-to-start/update-transaction.js'
import { licenseTypes } from '../pages/licence-details/licence-type/route.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { cacheDateFormat } from './date-and-time-display.js'
const debug = db('webapp:renewals-write-cache')
/**
 * Module is used for easy renewals where the data is read from the CRM and written into the session
 * cache.
 */
export const setUpCacheFromAuthenticationResult = async (request, authenticationResult) => {
  debug(`Set up cache from authentication result for renewal of ${authenticationResult.permission.referenceNumber}`)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  permission.isRenewal = true
  permission.licenceLength = '12M' // Always for easy renewals
  permission.licenceType = authenticationResult.permission.permit.permitSubtype.label
  permission.numberOfRods = authenticationResult.permission.permit.numberOfRods.toString()
  permission.isLicenceForYou = true
  const endDateMoment = moment.utc(authenticationResult.permission.endDate).tz(SERVICE_LOCAL_TIME)

  const renewedHasExpired = !endDateMoment.isAfter(moment().tz(SERVICE_LOCAL_TIME))

  permission.licenceToStart = renewedHasExpired ? licenceToStart.AFTER_PAYMENT : licenceToStart.ANOTHER_DATE
  permission.licenceStartDate = renewedHasExpired
    ? moment().tz(SERVICE_LOCAL_TIME).format(cacheDateFormat)
    : endDateMoment.format(cacheDateFormat)
  permission.licenceStartTime = renewedHasExpired ? 0 : endDateMoment.hours()
  permission.renewedEndDate = endDateMoment.toISOString()
  permission.renewedHasExpired = renewedHasExpired
  permission.licensee = Object.assign(
    (({ country: _country, shortTermPreferredMethodOfConfirmation: _shortTermPreferredMethodOfConfirmation, ...l }) => l)(
      authenticationResult.permission.licensee
    ),
    {
      countryCode: authenticationResult.permission.licensee.country.description
    }
  )

  // Delete any licensee objects which are null
  Object.entries(permission.licensee)
    .filter(e => e[1] === null)
    .map(e => e[0])
    .forEach(k => delete permission.licensee[k])

  permission.licensee.preferredMethodOfNewsletter = authenticationResult.permission.licensee.preferredMethodOfNewsletter.label
  permission.licensee.preferredMethodOfConfirmation = authenticationResult.permission.licensee.preferredMethodOfConfirmation.label
  permission.licensee.preferredMethodOfReminder = authenticationResult.permission.licensee.preferredMethodOfReminder.label

  // Add in concession proofs
  const concessions = await salesApi.concessions.getAll()
  permission.concessions = []
  authenticationResult.permission.concessions.forEach(concessionProof => {
    const concessionReference = concessions.find(c => c.id === concessionProof.id)
    if (concessionReference && concessionReference.name === constants.CONCESSION.DISABLED) {
      addDisabled(permission, concessionProof.proof.type.label, concessionProof.proof.referenceNumber)
    }
  })

  const showDigitalLicencePages = permission.licensee.postalFulfilment !== false

  // Add appropriate age concessions
  ageConcessionHelper(permission)
  await request.cache().helpers.transaction.setCurrentPermission(permission)
  await request.cache().helpers.status.setCurrentPermission({ showDigitalLicencePages })
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

  await request.cache().helpers.page.setCurrentPermission(ADDRESS_LOOKUP.page, {
    payload: {
      premises: permission.licensee.premises,
      postcode: permission.licensee.postcode
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

  await request.cache().helpers.status.setCurrentPermission({ [LICENCE_FULFILMENT.page]: true })
  await request.cache().helpers.status.setCurrentPermission({ [LICENCE_CONFIRMATION_METHOD.page]: true })
}
