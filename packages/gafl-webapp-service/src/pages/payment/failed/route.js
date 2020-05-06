import pageRoute from '../../../routes/page-route.js'
import { COMPLETION_STATUS } from '../../../constants.js'
import { PAYMENT_FAILED, CONTROLLER, NEW_TRANSACTION } from '../../../uri.js'
import Boom from '@hapi/boom'

const getData = async request => {
  const status = await request.cache().helpers.status.get()

  // If the cancelled flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.paymentFailed]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no agreed flag set')
  }

  return {
    uri: {
      new: NEW_TRANSACTION.uri
    }
  }
}

export default pageRoute(PAYMENT_FAILED.page, PAYMENT_FAILED.uri, null, CONTROLLER.uri, getData)
