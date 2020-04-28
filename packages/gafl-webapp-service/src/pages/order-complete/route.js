import pageRoute from '../../routes/page-route.js'

import { ORDER_COMPLETE, CONTROLLER } from '../../constants.js'

const getData = async request => {
  const status = await request.cache().helpers.status.get()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // If the agreed flag is not set to true then throw an exception
  if (!status.agreed) {
    throw new Error('Attempt to access the completion page handler with no agreed flag set')
  }

  // If the agreed flag is not set to true then throw an exception
  if (!status.posted) {
    throw new Error('Attempt to access the completion page handler with no posted flag set')
  }

  // If the transaction has already been finalised then redirect to the order completed page
  if (!status.finalised) {
    throw new Error('Attempt to access the completion page handler with no finalised flag set')
  }

  return {
    referenceNumber: permission.referenceNumber
  }
}

export default pageRoute(ORDER_COMPLETE.page, ORDER_COMPLETE.uri, null, CONTROLLER.uri, getData)
