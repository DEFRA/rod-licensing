import pageRoute from '../../../routes/page-route.js'
import Boom from '@hapi/boom'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../../constants.js'
import { ORDER_COMPLETE, NEW_TRANSACTION, LICENCE_DETAILS, LOCAL_BYELAWS, CATCH_RETURN } from '../../../uri.js'
import * as mappings from '../../../processors/mapping-constants.js'
import { nextPage } from '../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'

const checkForSalmonPermits = transaction => {
  return transaction.permissions.some(p => p.licenceType === mappings.LICENCE_TYPE['salmon-and-sea-trout'])
}

const getLicencePanelHTML = (price, numberOfLicences, mssgs) => {
  const suffix = numberOfLicences === 1 ? mssgs.order_complete_panel_text_single_licence : mssgs.order_complete_panel_text_multiple_licences
  let retVal
  if (price > 0) {
    retVal = `${mssgs.order_complete_panel_text_prefix}<span class=\"govuk-!-font-weight-bold\">${mssgs.pound}${price.toFixed(2)}</span>${mssgs.order_complete_panel_text_join}${numberOfLicences}${suffix}`
  } else {
    retVal = `${mssgs.order_complete_panel_text_free_prefix}${numberOfLicences}${suffix}`
  }
  console.log('licencePanelHTML', retVal)
  return retVal
}

const getViewDetailParagraphs = (licenceFulfilmentDigital, licenceFulfilmentPostal, mssgs) => {
  const paragraphs = []
  if (licenceFulfilmentDigital) {
    paragraphs.push(mssgs.order_complete_view_details_digital)
  }
  if (licenceFulfilmentPostal) {
    paragraphs.push(mssgs.order_complete_view_details_postal)
  }
  return paragraphs
}

const getWhenFishingParagraph = (licenceFulfilmentDigital, licenceFulfilmentPostal, mssgs) => {
  if (licenceFulfilmentDigital && licenceFulfilmentPostal) {
    return mssgs['order_complete_when_fishing_mixed']
  }
  if (licenceFulfilmentDigital) {
    return mssgs['order_complete_when_fishing_digital']
  }
  return `${mssgs['order_complete_when_fishing_postal']}<a href="${LICENCE_DETAILS.uri}">${mssgs['order_complete_when_fishing_postal_link']}</a>`
}

export const getData = async request => {
  const status = await request.cache().helpers.status.get()
  const transaction = await request.cache().helpers.transaction.get()
  const mssgs = request.i18n.getCatalog()

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
  const title = transaction.cost > 0 ? mssgs.order_complete_title_payment : mssgs.order_complete_title_application
  const numberOfLicences = transaction.permissions.length
  const licenceFulfilmentPostal = transaction.permissions.some(({ licensee }) => licensee.postalFulfilment && licensee.preferredMethodOfConfirmation === 'Prefer not to be contacted')
  const licenceFulfilmentDigital = transaction.permissions.some(({ licensee }) => !licensee.postalFulfilment)

  return {
    displayCatchReturnInfo: checkForSalmonPermits(transaction),
    title,
    titleHTML: transaction.cost > 0 ? `${mssgs.pound}${transaction.cost}<br />${title}` : title,
    licencePanelHTML: getLicencePanelHTML(transaction.cost, numberOfLicences, mssgs),
    viewDetailsParagraphs: getViewDetailParagraphs(licenceFulfilmentDigital, licenceFulfilmentPostal, mssgs),
    whenFishingParagraph: getWhenFishingParagraph(licenceFulfilmentDigital, licenceFulfilmentPostal, mssgs),

    uri: {
      feedback: process.env.FEEDBACK_URI || FEEDBACK_URI_DEFAULT,
      licenceDetails: addLanguageCodeToUri(request, LICENCE_DETAILS.uri),
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri),
      byelaws: LOCAL_BYELAWS.uri,
      salmonAndSeaTrout: CATCH_RETURN.uri
    }
  }
}

export default pageRoute(ORDER_COMPLETE.page, ORDER_COMPLETE.uri, null, nextPage, getData)
