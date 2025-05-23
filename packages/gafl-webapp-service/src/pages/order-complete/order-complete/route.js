import pageRoute from '../../../routes/page-route.js'
import Boom from '@hapi/boom'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../../constants.js'
import { ORDER_COMPLETE, NEW_TRANSACTION, LICENCE_DETAILS } from '../../../uri.js'
import { displayStartTime } from '../../../processors/date-and-time-display.js'
import * as mappings from '../../../processors/mapping-constants.js'
import { nextPage } from '../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { displayPrice } from '../../../processors/price-display.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { isRecurringPayment } from '../../../processors/recurring-pay-helper.js'

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
    recurringPayment: isRecurringPayment(transaction),
    uri: {
      feedback: process.env.FEEDBACK_URI || FEEDBACK_URI_DEFAULT,
      licenceDetails: addLanguageCodeToUri(request, LICENCE_DETAILS.uri),
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

const postalFulfilment = permission => {
  if (permission.licenceLength === '12M') {
    return permission.licensee.postalFulfilment ? 'postal' : 'non_postal'
  } else {
    return 'non_postal'
  }
}

const digitalConfirmation = permission =>
  permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.email ||
  permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.text

const digitalReminder = permission =>
  permission.licensee.preferredMethodOfReminder === HOW_CONTACTED.email ||
  permission.licensee.preferredMethodOfReminder === HOW_CONTACTED.text

const getOrderCompleteContent = (permission, mssgs, transaction) => {
  const permissionCost = displayPrice(transaction.cost, mssgs)
  const permissionIsFree = transaction.cost === 0

  return {
    title: permissionIsFree ? mssgs.order_complete_title_application : `${mssgs.order_complete_title_payment}${permissionCost}`,

    licenceTitle: permission.isLicenceForYou
      ? mssgs.order_complete_licence_details_self_title
      : mssgs.order_complete_licence_details_bobo_title,

    licenceDetailsDigitalParagraph: getLicenceDetailsDigitalContent(permission, mssgs),

    licenceDetailsParagraphTwo: permission.isLicenceForYou
      ? mssgs.order_complete_licence_details_self_paragraph
      : mssgs.order_complete_licence_details_bobo_paragraph,

    whenFishingParagraphOne: getEnforcementContent(permission, mssgs),

    whenFishingParagraphOneLink: permission.isLicenceForYou
      ? mssgs.order_complete_when_fishing_self_link
      : mssgs.order_complete_when_fishing_bobo_link,

    whenFishingParagraphTwo: permission.isLicenceForYou
      ? mssgs.order_complete_when_fishing_self_postal_non_digital_2
      : mssgs.order_complete_when_fishing_bobo_postal_non_digital_2,

    futurePaymentsParagraph: digitalReminder(permission)
      ? mssgs.order_complete_future_payments_digital_paragraph
      : mssgs.order_complete_future_payments_postal_paragraph
  }
}

const getLicenceDetailsDigitalContent = (permission, mssgs) => {
  if (digitalConfirmation(permission)) {
    if (permission.isLicenceForYou && permission.licensee.postalFulfilment) {
      return mssgs.order_complete_licence_details_self_digital_confirmation_paragraph
    } else if (permission.isLicenceForYou) {
      return mssgs.order_complete_licence_details_self_digital_paragraph
    } else if (permission.licensee.postalFulfilment) {
      return mssgs.order_complete_licence_details_bobo_digital_confirmation_paragraph
    } else {
      return mssgs.order_complete_licence_details_bobo_digital_paragraph
    }
  }

  return undefined
}

const getEnforcementContent = (permission, mssgs) => {
  const selfOrBobo = permission.isLicenceForYou ? 'self' : 'bobo'
  const postal = postalFulfilment(permission)
  const digital = digitalConfirmation(permission) ? 'digital' : 'non_digital'

  return mssgs[`order_complete_when_fishing_${selfOrBobo}_${postal}_${digital}`]
}

export default pageRoute(ORDER_COMPLETE.page, ORDER_COMPLETE.uri, null, nextPage, getData)
