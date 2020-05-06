import pageRoute from '../../../routes/page-route.js'
import { PAYMENT_CANCELLED, CONTROLLER, NEW_TRANSACTION } from '../../../uri.js'
import { COMPLETION_STATUS } from '../../../constants.js'

import Boom from '@hapi/boom'

const getData = async request => {
  const status = await request.cache().helpers.status.get()

  // If the cancelled flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.paymentCancelled]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no agreed flag set')
  }

  return {
    uri: {
      new: NEW_TRANSACTION.uri
    }
  }
}

export default pageRoute(PAYMENT_CANCELLED.page, PAYMENT_CANCELLED.uri, null, CONTROLLER.uri, getData)
