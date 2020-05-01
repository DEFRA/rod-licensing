import { prepareApiTransactionPayload } from '../processors/api-transaction.js'
import { permissionsOperations } from '../services/sales-api/sales-api-service.js'
import { FINALISED, ORDER_COMPLETE, COMPLETION_STATUS } from '../constants.js'
import { preparePayment } from '../services/payment/govuk-pay-service.js'
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
 * (3) Payment: Required -> dispatched -> [completed|cancelled\failed\apiError]
 *
 * @param request
 * @param h
 * @returns {Promise<ResponseObject|*|Response>}
 */
export default async (request, h) => {
  const status = await request.cache().helpers.status.get()
  const transaction = await request.cache().helpers.transaction.get()

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.agreed]) {
    throw Boom.forbidden(`Attempt to access the agreed handler with no agreed flag set: ${JSON.stringify(transaction)}`)
  }

  // If the transaction has already been finalised then redirect to the order completed page
  if (status[COMPLETION_STATUS.finalised]) {
    debug('Transaction %s already finalised, redirect to order complete: %s', transaction.id)
    return h.redirect(ORDER_COMPLETE.uri)
  }

  // If the transaction has already been posted to the API then redirect directly to the finalization
  if (status[COMPLETION_STATUS.posted]) {
    debug('Transaction %s already posted, redirect to finalisation', transaction.id)
    return h.redirect(FINALISED.uri)
  }

  /*
   * Post the transaction to the API
   */
  const apiTransactionPayload = await prepareApiTransactionPayload(request)
  const response = await permissionsOperations.postApiTransactionPayload(apiTransactionPayload)

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
  await request.cache().helpers.status.set({ [COMPLETION_STATUS.posted]: true })

  /*
   * If the value of the permissions is non-zero go through the payment journey
   */
  if (response.cost > 0) {
    /*
     * In production if GOV_PAY_API_URL is not set throw a 500 error
     */
    if (process.env.NODE_ENV === 'production' && !process.env.GOV_PAY_API_URL) {
      throw new Error('Cannot run in production mode without GOV_PAY_API_URL set')
    }

    if (process.env.GOV_PAY_API_URL) {
      const preparedPayment = await preparePayment(request, transaction)
      console.log({ preparedPayment })
    } else {
      debug('GOV_PAY_API_URL is not set, skipping the payment journey', transaction.id)
    }
  } else {
    debug('Zero cost transaction, skip payment journey', transaction.id)
  }
  /*
   * Redirect to the finalization
   */
  return h.redirect(FINALISED.uri)
}
