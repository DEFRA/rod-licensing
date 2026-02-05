import { salesApi } from '@defra-fish/connectors-lib'
import { CANCEL_RP_COMPLETE } from '../uri.js'
import db from 'debug'
const debug = db('webapp:cancel-rp-agreed')

/**
 * Cancel recurring payment agreed route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  const permission = await request.cache().helpers.status.getCurrentPermission()
  const recurringPaymentId = permission.recurringPayment.id
  try {
    await salesApi.cancelRecurringPayment(recurringPaymentId, 'User Cancelled')
  } catch (e) {
    debug('Error sending cancellation to Sales API', recurringPaymentId)
    throw e
  }

  return h.redirectWithLanguageCode(CANCEL_RP_COMPLETE.uri)
}
