import pageRoute from '../../routes/page-route.js'

import { ORDER_COMPLETE, CONTROLLER, COMPLETION_STATUS } from '../../constants.js'
import Boom from '@hapi/boom'

const getData = async request => {
  const status = await request.cache().helpers.status.get()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.agreed]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no agreed flag set')
  }

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.posted]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no posted flag set')
  }

  // If the transaction has already been finalised then redirect to the order completed page
  if (!status[COMPLETION_STATUS.finalised]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no finalised flag set')
  }

  await request.cache().helpers.status.set({ [COMPLETION_STATUS.completed]: true })

  return {
    referenceNumber: permission.referenceNumber
  }
}

export default pageRoute(ORDER_COMPLETE.page, ORDER_COMPLETE.uri, null, CONTROLLER.uri, getData)
