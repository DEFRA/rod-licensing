import { COMPLETION_STATUS } from '../../../constants.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const status = await request.cache().helpers.status.get()
  status[COMPLETION_STATUS.paymentCreated] = false
  status[COMPLETION_STATUS.paymentFailed] = false
  await request.cache().helpers.status.set(status)
}
