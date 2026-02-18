import moment from 'moment-timezone'
import db from 'debug'
import { LICENCE_TYPE, NAME, ADDRESS_LOOKUP, CONTACT, LICENCE_FULFILMENT, LICENCE_CONFIRMATION_METHOD } from '../uri.js'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import * as constants from './mapping-constants.js'
import { ageConcessionHelper } from './concession-helper.js'
import { licenceToStart } from '../pages/licence-details/licence-to-start/update-transaction.js'
import { licenseTypes } from '../pages/licence-details/licence-type/route.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { cacheDateFormat } from './date-and-time-display.js'
const debug = db('webapp:renewals-write-cache')

const getLicenceStartDate = (renewedHasExpired, licenceEndDate) => {
  if (renewedHasExpired) {
    return moment().tz(SERVICE_LOCAL_TIME)
  }
  return moment(licenceEndDate).add(1, 'minute').seconds(0).tz(SERVICE_LOCAL_TIME)
}

/**
 * Module is used for easy renewals where the data is read from the CRM and written into the session cache.
 */
export const setUpCacheFromAuthenticationResult = async (request, authenticationResult) => {
  const { referenceNumber, endDate } = authenticationResult.permission
  debug(`Set up cache from authentication result for renewal of ${referenceNumber}`)

  const preparedResponse = await salesApi.preparePermissionDataForRenewal(referenceNumber)
  const preparedPermission = preparedResponse.permission || preparedResponse

  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  Object.assign(permission, {
    isRenewal: true,
    licenceLength: '12M',
    licenceType: preparedPermission.licenceType,
    numberOfRods: preparedPermission.numberOfRods,
    isLicenceForYou: preparedPermission.isLicenceForYou,
    licensee: preparedPermission.licensee,
    concessions: preparedPermission.concessions
  })

  const endDateMoment = moment.utc(endDate).tz(SERVICE_LOCAL_TIME)

  const renewedHasExpired = !endDateMoment.isAfter(moment().tz(SERVICE_LOCAL_TIME))

  const startDateMoment = getLicenceStartDate(renewedHasExpired, endDateMoment)

  Object.assign(permission, {
    licenceToStart: renewedHasExpired ? licenceToStart.AFTER_PAYMENT : licenceToStart.ANOTHER_DATE,
    licenceStartDate: (renewedHasExpired ? moment().tz(SERVICE_LOCAL_TIME) : startDateMoment).format(cacheDateFormat),
    licenceStartTime: renewedHasExpired ? 0 : startDateMoment.hours(),
    renewedEndDate: endDateMoment.toISOString(),
    renewedHasExpired
  })

  ageConcessionHelper(permission)

  const showDigitalLicencePages = permission.licensee.postalFulfilment !== false
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
        default:
          return { 'how-contacted': 'none' }
      }
    })(permission.licensee)
  })

  await request.cache().helpers.status.setCurrentPermission({ [LICENCE_FULFILMENT.page]: true })
  await request.cache().helpers.status.setCurrentPermission({ [LICENCE_CONFIRMATION_METHOD.page]: true })
}
