import pageRoute from '../../../routes/page-route.js'

import Boom from '@hapi/boom'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../../constants.js'
import { ORDER_COMPLETE, NEW_TRANSACTION, LICENCE_DETAILS } from '../../../uri.js'
import { displayStartTime } from '../../../processors/date-and-time-display.js'
import * as mappings from '../../../processors/mapping-constants.js'
import { nextPage } from '../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { displayPermissionPrice } from '../../../processors/price-display.js'
import { getPermissionCost } from '@defra-fish/business-rules-lib'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'

export const getData = async request => {
  const status = await request.cache().helpers.status.get()
  const transaction = await request.cache().helpers.transaction.get()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.agreed]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no agreed flag set')
  }

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.posted]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no posted flag set')
  }

  // If the finalised flag has not been set throw an exception
  if (!status[COMPLETION_STATUS.finalised]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no finalised flag set')
  }

  await request.cache().helpers.status.set({ [COMPLETION_STATUS.completed]: true })
  await request.cache().helpers.status.setCurrentPermission({ currentPage: ORDER_COMPLETE.page })
  const digital = digitalConfirmation(permission)

  return {
    content: getOrderCompleteContent(permission, request.i18n.getCatalog(), transaction),
    startTimeStringTitle: displayStartTime(request, permission),
    isSalmonLicence: permission.licenceType === mappings.LICENCE_TYPE['salmon-and-sea-trout'],
    permissionReference: permission.referenceNumber,
    digitalConfirmation: digital && permission.licensee.postalFulfilment,
    digitalLicence: digital && !permission.licensee.postalFulfilment,
    postalLicence: permission.licensee.postalFulfilment,
    uri: {
      feedback: process.env.FEEDBACK_URI || FEEDBACK_URI_DEFAULT,
      licenceDetails: addLanguageCodeToUri(request, LICENCE_DETAILS.uri),
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

const digitalConfirmation = permission => {
  if (
    permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.email ||
    permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.text
  ) {
    return true
  }

  return false
}

const getOrderCompleteContent = (permission, mssgs, transaction) => {
  const permissionCost = displayPermissionPrice(permission, mssgs, transaction.payment?.created_date)
  const permissionIsFree = getPermissionCost(permission, transaction.payment?.created_date) === 0
  const content = {}

  content.title = permissionIsFree ? mssgs.order_complete_title_application : mssgs.order_complete_title_payment + permissionCost
  content.licenceTitle = permission.isLicenceForYou
    ? mssgs.order_complete_licence_details_self_title
    : mssgs.order_complete_licence_details_bobo_title
  content.licenceDetailsDigitalParagraph = getLicenceDetailsDigitalContent(permission, mssgs)
  content.licenceDetailsParagraphTwo = permission.isLicenceForYou
    ? mssgs.order_complete_licence_details_self_paragraph
    : mssgs.order_complete_licence_details_bobo_paragraph
  content.whenFishingParagraphOne = getEnforcementContent(permission, mssgs)
  content.whenFishingParagraphOneLink = permission.isLicenceForYou
    ? mssgs.order_complete_when_fishing_self_link
    : mssgs.order_complete_when_fishing_bobo_link
  content.whenFishingParagraphTwo = permission.isLicenceForYou
    ? mssgs.order_complete_when_fishing_self_paragraph_2
    : mssgs.order_complete_when_fishing_bobo_paragraph_2

  return content
}

const getLicenceDetailsDigitalContent = (permission, mssgs) => {
  if (digitalConfirmation(permission)) {
    if (permission.isLicenceForYou && permission.licensee.postalFulfilment) {
      return mssgs.order_complete_licence_details_self_digital_confirmation_paragraph
    } else if (!permission.isLicenceForYou && permission.licensee.postalFulfilment) {
      return mssgs.order_complete_licence_details_bobo_digital_confirmation_paragraph
    } else if (permission.isLicenceForYou && !permission.licensee.postalFulfilment) {
      return mssgs.order_complete_licence_details_self_digital_paragraph
    } else if (!permission.isLicenceForYou && !permission.licensee.postalFulfilment) {
      return mssgs.order_complete_licence_details_bobo_digital_paragraph
    }
  }
}

const getEnforcementContent = (permission, mssgs) => {
  if (!digitalConfirmation(permission)) {
    if (permission.isLicenceForYou && permission.licensee.postalFulfilment) {
      return mssgs.order_complete_when_fishing_self_paragraph
    } else if (!permission.isLicenceForYou && permission.licensee.postalFulfilment) {
      return mssgs.order_complete_when_fishing_bobo_paragraph
    }
  } else {
    if (permission.isLicenceForYou && permission.licensee.postalFulfilment) {
      return mssgs.order_complete_when_fishing_self_digital_confirmation_paragraph
    } else if (!permission.isLicenceForYou && permission.licensee.postalFulfilment) {
      return mssgs.order_complete_when_fishing_bobo_digital_confirmation_paragraph
    } else if (permission.isLicenceForYou && !permission.licensee.postalFulfilment) {
      return mssgs.order_complete_when_fishing_self_digital_paragraph
    } else if (!permission.isLicenceForYou && !permission.licensee.postalFulfilment) {
      return mssgs.order_complete_when_fishing_bobo_digital_paragraph
    }
  }
}

export default pageRoute(ORDER_COMPLETE.page, ORDER_COMPLETE.uri, null, nextPage, getData)
