import { prepareApiFinalisationPayload } from '../processors/api-transaction.js'
import { permissionsOperations } from '../services/sales-api/sales-api-service.js'
import { COMPLETION_STATUS } from '../constants.js'
import { ORDER_COMPLETE } from '../uri.js'

import db from 'debug'
import Boom from '@hapi/boom'

const debug = db('webapp:finalisation-handler')

/**
 * This handler is called when the user completes payment
 * or in the case of the free licence they complete the initial submission
 * of the transaction to the API
 *
 * (1) Agree -> post -> finalise -> complete
 * (2) Agree -> post -> payment -> finalise -> complete
 * (3) Payment: Required -> dispatched -> [completed|cancelled\failed\apiError]
 * @param request
 * @param h
 * @returns {Promise<ResponseObject|*|Response>}
 */
export default async (request, h) => {
  const status = await request.cache().helpers.status.get()
  const transaction = await request.cache().helpers.transaction.get()

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.agreed]) {
    throw Boom.forbidden(`Attempt to access the finalise handler with no agreed flag set: ${JSON.stringify(transaction)}`)
  }

  // If the posted flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.posted]) {
    throw Boom.forbidden(`Attempt to access the finalise handler with no posted flag set: ${JSON.stringify(transaction)}`)
  }

  // If the transaction has already been finalised then redirect to the order completed page
  if (status[COMPLETION_STATUS.finalised]) {
    debug('Transaction %s already finalised, redirect to order complete', transaction.id)
    return h.redirect(ORDER_COMPLETE.uri)
  }

  /**
   * Finalise the transaction
   */
  const apiFinalisationPayload = await prepareApiFinalisationPayload(request)
  debug('Patch transaction finalisation : %s', JSON.stringify(apiFinalisationPayload, null, 4))
  await permissionsOperations.patchApiTransactionPayload(apiFinalisationPayload, transaction.id)

  await request.cache().helpers.status.set({ [COMPLETION_STATUS.finalised]: true })
  return h.redirect(ORDER_COMPLETE.uri)
}
