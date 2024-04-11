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
 */
import Boom from '@hapi/boom'
import db from 'debug'
import { salesApi } from '@defra-fish/connectors-lib'
import { prepareApiTransactionPayload, prepareApiFinalisationPayload } from '../processors/api-transaction.js'
import { sendPayment, getPaymentStatus } from '../services/payment/govuk-pay-service.js'
import { preparePayment } from '../processors/payment.js'
import { pauseRecording, resumeRecording } from '../services/call-recording/call-recording-service.js'
import { COMPLETION_STATUS } from '../constants.js'
import { ORDER_COMPLETE, PAYMENT_CANCELLED, PAYMENT_FAILED } from '../uri.js'
import { PAYMENT_JOURNAL_STATUS_CODES, GOVUK_PAY_ERROR_STATUS_CODES } from '@defra-fish/business-rules-lib'
const debug = db('webapp:agreed-handler')

/**
 * Send (post) transaction to sales API
 * @param request
 * @param transaction
 * @param status
 * @returns {Promise<*>}
 */
const sendToSalesApi = async (request, transaction, status) => {
  const apiTransactionPayload = await prepareApiTransactionPayload(request)
  let response
  try {
    response = await salesApi.createTransaction(apiTransactionPayload)
  } catch (e) {
    debug('Error creating transaction', JSON.stringify(apiTransactionPayload))
    throw e
  }
  transaction.id = response.id
  transaction.cost = response.cost
  status[COMPLETION_STATUS.posted] = true
  debug('Got transaction identifier: %s', transaction.id)

  await request.cache().helpers.transaction.set(transaction)
  await request.cache().helpers.status.set(status)

  return transaction
}

/**
 * Create a new payment in GOV.UK pay using the API
 * (1) Prepare payment (payload) for the API (processor)
 * (2) Send to GOV.UK pay API (connector)
 * (3) Handle exceptions and error (agreed handler)
 * (4) Write into the journal tables (agreed handler)
 * (5) Process the results - write into the cache
 * @param request
 * @param transaction
 * @param status
 * @returns {Promise<void>}
 */
const createPayment = async (request, transaction, status) => {
  /*
   * Prepare the payment payload
   */
  const preparedPayment = preparePayment(request, transaction)

  /*
   * Send the prepared payment to the GOV.UK pay API using the connector
   */
  const paymentResponse = await sendPayment(preparedPayment)

  /*
   * Used by the payment mop up job, create the payment journal entry which is removed when the user completes the journey
   * it maybe updated multiple times with a new payment id and creation date if the payment is cancelled and retried
   */
  if (await salesApi.getPaymentJournal(transaction.id)) {
    await salesApi.updatePaymentJournal(transaction.id, {
      paymentReference: paymentResponse.payment_id,
      paymentTimestamp: paymentResponse.created_date,
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
    })
  } else {
    await salesApi.createPaymentJournal(transaction.id, {
      paymentReference: paymentResponse.payment_id,
      paymentTimestamp: paymentResponse.created_date,
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
    })
  }

  /*
   * Set up the payment details in the transaction and status cache
   */
  transaction.payment = {
    state: paymentResponse.state,
    payment_id: paymentResponse.payment_id,
    payment_provider: paymentResponse.payment_provider,
    created_date: paymentResponse.created_date,
    href: paymentResponse._links.next_url.href,
    self_href: paymentResponse._links.self.href
  }

  status[COMPLETION_STATUS.paymentCreated] = true
  await request.cache().helpers.status.set(status)
  await request.cache().helpers.transaction.set(transaction)
}

/**
 * Called when the user has returned to the service from the payment pages. It queries the
 * GOV.UK pay API for the payment status. It updates the journal and determines the
 * next page to display which is either order-complete, or the cancelled or failure pages
 * @param request
 * @param transaction
 * @param status
 * @returns {Promise<void>}
 */
const processPayment = async (request, transaction, status) => {
  /*
   * Get the payment status
   */
  const { state } = await getPaymentStatus(transaction.payment.payment_id)

  if (!state.finished) {
    throw Boom.forbidden('Attempt to access the agreed handler during payment journey')
  }

  let next = null

  if (state.status === 'error') {
    // The payment failed
    await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
    status[COMPLETION_STATUS.paymentFailed] = true
    status.payment = { code: state.code }
    await request.cache().helpers.status.set(status)
    next = PAYMENT_FAILED.uri
  }

  if (state.status === 'success') {
    // Defer setting the completed status in the journal until after finalization
    status[COMPLETION_STATUS.paymentCompleted] = true
    await request.cache().helpers.status.set(status)
  } else {
    /*
     * This block deals with failed or cancelled payments
     */

    // The payment expired
    if (state.code === GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED) {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
      status[COMPLETION_STATUS.paymentFailed] = true
      status.payment = { code: state.code }
      await request.cache().helpers.status.set(status)
      next = PAYMENT_FAILED.uri
    }

    // The user cancelled the payment
    if (state.code === GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED) {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Cancelled })
      status[COMPLETION_STATUS.paymentCancelled] = true
      status.pay = { code: state.code }
      await request.cache().helpers.status.set(status)
      next = PAYMENT_CANCELLED.uri
    }

    // The payment was rejected
    if (state.code === GOVUK_PAY_ERROR_STATUS_CODES.REJECTED) {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
      status[COMPLETION_STATUS.paymentFailed] = true
      status.payment = { code: state.code }
      await request.cache().helpers.status.set(status)
      next = PAYMENT_FAILED.uri
    }
  }

  return next
}

const finaliseTransaction = async (request, transaction, status) => {
  const apiFinalisationPayload = await prepareApiFinalisationPayload(request)
  debug('Patch transaction finalisation : %s', JSON.stringify(apiFinalisationPayload, null, 4))
  const response = await salesApi.finaliseTransaction(transaction.id, apiFinalisationPayload)

  /*
   * Write the licence number and end dates into the cache
   */
  for (let i = 0; i < response.permissions.length; i++) {
    debug(`Setting permission reference number: ${response.permissions[i].referenceNumber}`)
    transaction.permissions[i].referenceNumber = response.permissions[i].referenceNumber
    debug(`Setting permission issue date: ${response.permissions[i].issueDate}`)
    transaction.permissions[i].issueDate = response.permissions[i].issueDate
    debug(`Setting permission start date: ${response.permissions[i].startDate}`)
    transaction.permissions[i].startDate = response.permissions[i].startDate
    debug(`Setting permission end date: ${response.permissions[i].endDate}`)
    transaction.permissions[i].endDate = response.permissions[i].endDate
    debug(`Setting obfuscated dob: ${response.permissions[i].licensee.obfuscatedDob}`)
    transaction.permissions[i].licensee.obfuscatedDob = response.permissions[i].licensee.obfuscatedDob
  }
  status[COMPLETION_STATUS.finalised] = true
  await request.cache().helpers.status.set(status)
  await request.cache().helpers.transaction.set(transaction)
  // Set the completed status
  if (transaction.cost > 0) {
    await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed })
  }
}

/**
 * Agreed route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  const status = await request.cache().helpers.status.get()
  const transaction = await request.cache().helpers.transaction.get()

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.agreed]) {
    throw Boom.forbidden(`Attempt to access the agreed handler with no agreed flag set: ${JSON.stringify(transaction)}`)
  }

  // Send the transaction to the sales API and process the response
  if (!status[COMPLETION_STATUS.posted]) {
    try {
      await sendToSalesApi(request, transaction, status)
    } catch (e) {
      debug('Error sending transaction to Sales Api', JSON.stringify(transaction), JSON.stringify(status))
      throw e
    }
  }

  // The payment section is ignored for zero cost transactions
  if (transaction.cost > 0) {
    if (process.env.CHANNEL === 'telesales') {
      await pauseRecording(request.auth.credentials.email)
    }
    // Send the transaction to the GOV.UK payment API and process the response
    if (!status[COMPLETION_STATUS.paymentCreated]) {
      await createPayment(request, transaction, status)
      return h.redirect(transaction.payment.href)
    }

    // Note: At this point payment completed status is never set
    const next = await processPayment(request, transaction, status)
    if (next) {
      return h.redirectWithLanguageCode(next)
    }
  }

  // If the transaction has already been finalised then redirect to the order completed page
  if (!status[COMPLETION_STATUS.finalised]) {
    await finaliseTransaction(request, transaction, status)
  } else {
    debug('Transaction %s already finalised, redirect to order complete: %s', transaction.id)
  }

  // If we are here we have completed
  if (transaction.cost > 0 && process.env.CHANNEL === 'telesales') {
    await resumeRecording(request.auth.credentials.email)
  }
  return h.redirectWithLanguageCode(ORDER_COMPLETE.uri)
}
