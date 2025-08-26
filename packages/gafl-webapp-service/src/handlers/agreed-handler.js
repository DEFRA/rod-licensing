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
import { sendPayment, sendRecurringPayment } from '../services/payment/govuk-pay-service.js'
import { preparePayment, prepareRecurringPaymentAgreement } from '../processors/payment.js'
import { COMPLETION_STATUS, RECURRING_PAYMENT } from '../constants.js'
import { ORDER_COMPLETE } from '../uri.js'
import { PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { v4 as uuidv4 } from 'uuid'
const debug = db('webapp:agreed-handler')

/**
 * Send (post) transaction to sales API
 * @param request
 * @param transaction
 * @param status
 * @returns {Promise<*>}
 */
const sendToSalesApi = async (request, transaction, status) => {
  const apiTransactionPayload = await prepareApiTransactionPayload(request, transaction.id, transaction.agreementId)
  let response
  try {
    response = await salesApi.createTransaction(apiTransactionPayload)
  } catch (e) {
    debug('Error creating transaction', JSON.stringify(apiTransactionPayload))
    throw e
  }
  transaction.cost = response.cost
  status[COMPLETION_STATUS.posted] = true
  debug('Transaction identifier: %s', transaction.id)

  await request.cache().helpers.transaction.set(transaction)
  await request.cache().helpers.status.set(status)

  return transaction
}

/**
 * Grab the agreement id in GOV.UK pay using the API
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
const createRecurringPayment = async (request, transaction, status) => {
  /*
   * Prepare the payment payload
   */
  const preparedPayment = await prepareRecurringPaymentAgreement(request, transaction)
  /*
   * Send the prepared payment to the GOV.UK pay API using the connector
   */
  const paymentResponse = await sendRecurringPayment(preparedPayment)

  debug(`Created agreement with id ${paymentResponse.agreement_id}`)
  status[COMPLETION_STATUS.recurringAgreement] = true

  transaction.agreementId = paymentResponse.agreement_id

  await request.cache().helpers.status.set(status)
  await request.cache().helpers.transaction.set(transaction)
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
  const recurring = status && status[COMPLETION_STATUS.recurringAgreement] === true

  /*
   * Prepare the payment payload
   */
  const preparedPayment = preparePayment(request, transaction)

  /*
   * Send the prepared payment to the GOV.UK pay API using the connector
   */
  const paymentResponse = await sendPayment(preparedPayment, recurring)

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
  if (!transaction.id) {
    transaction.id = uuidv4()
  }

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.agreed]) {
    throw Boom.forbidden(`Attempt to access the agreed handler with no agreed flag set: ${JSON.stringify(transaction)}`)
  }

  // Send the transaction to the sales API and process the response
  if (!status[COMPLETION_STATUS.posted]) {
    // Create the agreement if a recurring payment
    if (status[RECURRING_PAYMENT] === true) {
      await createRecurringPayment(request, transaction, status)
    }
    try {
      await sendToSalesApi(request, transaction, status)
    } catch (e) {
      debug('Error sending transaction to Sales Api', JSON.stringify(transaction), JSON.stringify(status))
      throw e
    }
  }

  // The payment section is ignored for zero cost transactions
  if (transaction.cost > 0) {
    // Send the transaction to the GOV.UK payment API and process the response
    if (!status[COMPLETION_STATUS.paymentCreated]) {
      await createPayment(request, transaction, status)
      return h.redirect(transaction.payment.href)
    }

    debug('Payment created, skipping processPayment/finaliseTransaction to allow mop-up')
    return h.redirect('/payment-pending')

    // Note: At this point payment completed status is never set
    // const next = await processPayment(request, transaction, status)
    // if (next) {
    //   return h.redirectWithLanguageCode(next)
    // }
  }

  // If the transaction has already been finalised then redirect to the order completed page
  if (!status[COMPLETION_STATUS.finalised]) {
    await finaliseTransaction(request, transaction, status)
  } else {
    debug('Transaction %s already finalised, redirect to order complete: %s', transaction.id)
  }

  // If we are here we have completed
  return h.redirectWithLanguageCode(ORDER_COMPLETE.uri)
}
