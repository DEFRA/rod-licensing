import Boom from '@hapi/boom'
import pageRoute from '../../../routes/page-route.js'
import { PAYMENT_CANCELLED, NEW_TRANSACTION } from '../../../uri.js'
import { nextPage } from '../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'

import { COMPLETION_STATUS } from '../../../constants.js'

export const getData = async request => {
  const status = await request.cache().helpers.status.get()

  // If the payment created flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.paymentCreated]) {
    throw Boom.forbidden('Attempt to access the cancellation page handler with no agreed flag set')
  }

  return {
    uri: {
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

export default pageRoute(PAYMENT_CANCELLED.page, PAYMENT_CANCELLED.uri, null, nextPage, getData)
