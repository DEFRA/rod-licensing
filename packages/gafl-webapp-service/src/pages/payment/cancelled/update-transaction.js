import { COMPLETION_STATUS } from '../../../constants.js'

/**
 * Removes the payment created and payment cancelled statuses to enable a retry
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const status = await request.cache().helpers.status.get()
  status[COMPLETION_STATUS.paymentCreated] = false
  status[COMPLETION_STATUS.paymentCancelled] = false
  await request.cache().helpers.status.set(status)
}
