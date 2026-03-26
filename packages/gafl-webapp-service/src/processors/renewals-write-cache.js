import db from 'debug'
import { LICENCE_TYPE, NAME, ADDRESS_LOOKUP, CONTACT, LICENCE_FULFILMENT, LICENCE_CONFIRMATION_METHOD } from '../uri.js'
import * as constants from './mapping-constants.js'
import { licenseTypes } from '../pages/licence-details/licence-type/route.js'
import { salesApi } from '@defra-fish/connectors-lib'
const debug = db('webapp:renewals-write-cache')

/**
 * Module is used for easy renewals where the data is prepared by the Sales API and written into the session cache.
 * The Sales API service handles all data transformation including concession logic and date calculations.
 */
export const setUpCacheFromAuthenticationResult = async (request, authenticationResult) => {
  const referenceNumber = authenticationResult.permission.referenceNumber
  debug(`Set up cache from authentication result for renewal of ${referenceNumber}`)

  // Get prepared permission data from Sales API
  const preparedData = await salesApi.preparePermissionDataForRenewal(referenceNumber)

  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // Populate cache from prepared data
  permission.isRenewal = preparedData.isRenewal
  permission.licenceLength = preparedData.licenceLength
  permission.licenceType = preparedData.licenceType
  permission.numberOfRods = preparedData.numberOfRods
  permission.isLicenceForYou = preparedData.isLicenceForYou
  permission.licenceToStart = preparedData.licenceToStart
  permission.licenceStartDate = preparedData.licenceStartDate
  permission.licenceStartTime = preparedData.licenceStartTime
  permission.renewedEndDate = preparedData.renewedEndDate
  permission.renewedHasExpired = preparedData.renewedHasExpired

  permission.licensee = {
    ...preparedData.licensee,
    preferredMethodOfNewsletter: preparedData.licensee.preferredMethodOfNewsletter,
    preferredMethodOfConfirmation: preparedData.licensee.preferredMethodOfConfirmation,
    preferredMethodOfReminder: preparedData.licensee.preferredMethodOfReminder
  }

  Object.entries(permission.licensee)
    .filter(e => e[1] === null)
    .map(e => e[0])
    .forEach(k => delete permission.licensee[k])

  permission.concessions = preparedData.concessions.map(concession => ({
    type: concession.name,
    proof: {
      type: concession.proof.type,
      ...(concession.proof.referenceNumber ? { referenceNumber: concession.proof.referenceNumber } : {})
    }
  }))

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
