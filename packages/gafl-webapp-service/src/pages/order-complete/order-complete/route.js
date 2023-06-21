import pageRoute from '../../../routes/page-route.js'

import Boom from '@hapi/boom'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../../constants.js'
import { ORDER_COMPLETE, NEW_TRANSACTION, LICENCE_DETAILS } from '../../../uri.js'
import * as mappings from '../../../processors/mapping-constants.js'
import { nextPage } from '../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'

const checkForSalmonPermits = transaction => {
  return transaction.permissions.some(p => p.licenceType === mappings.LICENCE_TYPE['salmon-and-sea-trout'])
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

  return {
    displayCatchReturnInfo: checkForSalmonPermits(transaction),
    title,
    titleHTML: transaction.cost > 0 ? `${mssgs.pound}${transaction.cost}<br />${title}` : title,
    licencePanelText: `${numberOfLicences}${
      numberOfLicences > 1 ? mssgs.order_complete_licence_count_multiple : mssgs.order_complete_licence_count_single
    }`,

    uri: {
      feedback: process.env.FEEDBACK_URI || FEEDBACK_URI_DEFAULT,
      licenceDetails: addLanguageCodeToUri(request, LICENCE_DETAILS.uri),
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

export default pageRoute(ORDER_COMPLETE.page, ORDER_COMPLETE.uri, null, nextPage, getData)
