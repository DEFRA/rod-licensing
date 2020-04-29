import { prepareApiTransactionPayload } from '../processors/api-transaction.js'
import { permissionsOperations } from '../services/sales-api/sales-api-service.js'
import { FINALISED, ORDER_COMPLETE } from '../constants.js'
import db from 'debug'
import Boom from '@hapi/boom'
const debug = db('webapp:agreed-handler')

/**
 * This handler is called after the user has agreed the licence purchase.
 * It locks the transaction and posts it the the API. This will create a licence number and end date
 * If the licence has a cost the user is then redirected into the payment pages, otherwise the
 * they are redirected immediately to the finalization handler
 *
 * (1) Agree -> post -> finalise -> complete
 * (2) Agree -> post -> payment -> finalise -> complete
 *
 * @param request
 * @param h
 * @returns {Promise<ResponseObject|*|Response>}
 */
export default async (request, h) => {
  const status = await request.cache().helpers.status.get()
  const transaction = await request.cache().helpers.transaction.get()

  // If the agreed flag is not set to true then throw an exception
  if (!status.agreed) {
    throw Boom.forbidden(`Attempt to access the agreed handler with no agreed flag set: ${JSON.stringify(transaction)}`)
  }

  // If the transaction has already been finalised then redirect to the order completed page
  if (status.finalised) {
    debug('Transaction %s already finalised, redirect to order complete: %s', transaction.id)
    return h.redirect(ORDER_COMPLETE.uri)
  }

  // If the transaction has already been posted to the API then redirect directly to the finalization
  if (status.posted) {
    debug('Transaction %s already posted, redirect to finalisation', transaction.id)
    return h.redirect(FINALISED.uri)
  }

  /*
   * Post the transaction to the API
   */
  const apiTransactionPayload = await prepareApiTransactionPayload(request)
  debug('Post transaction: %s', JSON.stringify(apiTransactionPayload, null, 4))
  const response = await permissionsOperations.postApiTransactionPayload(apiTransactionPayload)
  debug('Got response: %s', JSON.stringify(response, null, 4))

  /*
   * Write the licence number and end dates into the cache
   */
  for (let i = 0; i < response.permissions.length; i++) {
    debug(`Setting permission reference number: ${response.permissions[i].referenceNumber}`)
    transaction.permissions[i].referenceNumber = response.permissions[i].referenceNumber
    transaction.permissions[i].endDate = response.permissions[i].endDate
  }
  transaction.id = response.id
  transaction.cost = response.cost
  debug('Got transaction identifier: %s', transaction.id)

  await request.cache().helpers.transaction.set(transaction)
  await request.cache().helpers.status.set({ posted: true })

  /*
   * Redirect to the finalization
   */
  return h.redirect(FINALISED.uri)
}
