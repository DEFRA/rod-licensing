import { prepareApiTransactionPayload, prepareApiFinalisationPayload } from '../processors/api-transaction.js'
import { permissionsOperations } from '../services/sales-api/sales-api-service.js'
import { COMPLETION_STATUS } from '../constants.js'
import { ORDER_COMPLETE, PAYMENT_CANCELLED, PAYMENT_FAILED } from '../uri.js'
import { postData, preparePayment, getGovUkPaymentStatus, GOVPAY_STATUS_CODES } from '../services/payment/govuk-pay-service.js'
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

/*
 * Post the transaction to the API
 */
const sendToSalesApi = async (request, transaction, status) => {
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
  status[COMPLETION_STATUS.posted] = true
  debug('Got transaction identifier: %s', transaction.id)

  await request.cache().helpers.transaction.set(transaction)
  await request.cache().helpers.status.set(status)

  return transaction
}

const createPayment = async (request, transaction, status) => {
  const preparedPayment = preparePayment(transaction)
  const payment = await postData(preparedPayment, transaction.id)
  transaction.payment = {
    state: payment.state,
    payment_id: payment.payment_id,
    payment_provider: payment.payment_provider,
    created_date: payment.created_date,
    href: payment._links.next_url.href,
    self_href: payment._links.self.href
  }
  status[COMPLETION_STATUS.paymentCreated] = true
  await request.cache().helpers.status.set(status)
  await request.cache().helpers.transaction.set(transaction)
}

const completePayment = async (request, transaction, status) => {
  const { state } = await getGovUkPaymentStatus(transaction.payment.self_href, transaction.id)

  if (!state.finished) {
    throw Boom.forbidden('Attempt to access the agreed handler during payment journey')
  }

  let next = null

  if (state.status === 'error') {
    // The payment expired
    if (state.code === GOVPAY_STATUS_CODES.ERROR) {
      status[COMPLETION_STATUS.paymentFailed] = true
      status.payment = { code: state.code }
      await request.cache().helpers.status.set(status)
      next = PAYMENT_FAILED.uri
    } else {
      throw Boom.badImplementation('Unknown GOV.UK pay or payment provider error')
    }
  }

  if (state.status === 'success') {
    status[COMPLETION_STATUS.paymentCompleted] = true
    await request.cache().helpers.status.set(status)
  } else {
    // The payment expired
    if (state.code === GOVPAY_STATUS_CODES.EXPIRED) {
      status[COMPLETION_STATUS.paymentFailed] = true
      status.payment = { code: state.code }
      await request.cache().helpers.status.set(status)
      next = PAYMENT_FAILED.uri
    }

    // The user cancelled the payment
    if (state.code === GOVPAY_STATUS_CODES.USER_CANCELLED) {
      status[COMPLETION_STATUS.paymentCancelled] = true
      status.pay = { code: state.code }
      await request.cache().helpers.status.set(status)
      next = PAYMENT_CANCELLED.uri
    }

    // The payment was rejected
    if (state.code === GOVPAY_STATUS_CODES.REJECTED) {
      status[COMPLETION_STATUS.paymentFailed] = true
      status.payment = { code: state.code }
      await request.cache().helpers.status.set(status)
      next = PAYMENT_FAILED.uri
    }
  }

  return next
}

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

  // Send the transaction to the sales API and process the response
  if (!status[COMPLETION_STATUS.posted]) {
    await sendToSalesApi(request, transaction, status)
  }

  // The payment section is ignored for zero cost transactions
  if (transaction.cost > 0) {
    // Send the transaction to the GOV.UK payment API and process the response
    if (!status[COMPLETION_STATUS.paymentCreated]) {
      await createPayment(request, transaction, status)
      return h.redirect(transaction.payment.href)
    }

    if (!status[COMPLETION_STATUS.paymentCompleted]) {
      const next = await completePayment(request, transaction, status)
      if (next) {
        return h.redirect(next)
      }
    }
  }

  if (!status[COMPLETION_STATUS.finalised]) {
    const apiFinalisationPayload = await prepareApiFinalisationPayload(request)
    debug('Patch transaction finalisation : %s', JSON.stringify(apiFinalisationPayload, null, 4))
    await permissionsOperations.patchApiTransactionPayload(apiFinalisationPayload, transaction.id)
    status[COMPLETION_STATUS.finalised] = true
    await request.cache().helpers.status.set(status)
  }

  // If we are here we have completed
  return h.redirect(ORDER_COMPLETE.uri)
}
