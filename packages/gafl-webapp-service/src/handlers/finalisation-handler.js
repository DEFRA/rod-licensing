import prepareApiTransactionPayload from '../processors/prepare-api-transaction-payload.js'
import { permissionsOperations } from '../services/sales-api/sales-api-service.js'
import { ORDER_COMPLETE } from '../constants.js'
import db from 'debug'
const debug = db('webapp:finalisation-handler')

/**
 * This handler is called when the user completes payment
 * or in the case of the free licence they complete the initial submission
 * of the transaction to the API
 *
 * (1) Agree -> post -> finalise -> complete
 * (2) Agree -> post -> payment -> finalise -> complete
 * @param request
 * @param h
 * @returns {Promise<ResponseObject|*|Response>}
 */
export default async (request, h) => {
  const status = await request.cache().helpers.status.get()
  const transaction = await request.cache().helpers.transaction.get()

  // If the agreed flag is not set to true then throw an exception
  if (!status.agreed) {
    throw new Error('Attempt to access the finalise handler with no agreed flag set')
  }

  // If the agreed flag is not set to true then throw an exception
  if (!status.posted) {
    throw new Error('Attempt to access the finalise handler with no posted flag set')
  }

  // If the transaction has already been finalised then redirect to the order completed page
  if (status.finalised) {
    debug('Transaction %s already finalised, redirect to order complete', transaction.id)
    return h.redirect(ORDER_COMPLETE.uri)
  }

  /**
   * Finalise the transaction
   */

  await request.cache().helpers.status.set({ finalised: true })
  return h.redirect(ORDER_COMPLETE.uri)
}
