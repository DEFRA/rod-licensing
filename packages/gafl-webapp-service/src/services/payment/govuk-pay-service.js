/***
 * Interface to the GOV.UK Pay API - uses the service connector salesApi.
 * It wraps the payment API connector and ensures that exceptions and errors
 * are handled correctly in respect to retry and user messaging. This module is
 * not reliant on the hapi request object
 */
import { govUkPayApi } from '@defra-fish/connectors-lib'
import { GOVPAYFAIL } from '../../constants.js'
import db from 'debug'
import Boom from '@hapi/boom'
const debug = db('webapp:govuk-pay-service')

const HTTP_TOO_MANY_REQUESTS = 429
const getErrorType = (response, id, idTag = 'tid', payloadOrigin = GOVPAYFAIL.prePaymentRetry) => {
  if (response.status === HTTP_TOO_MANY_REQUESTS) {
    const msg = `GOV.UK Pay API rate limit breach - ${idTag}: ${id}`
    console.info(msg)
    const badImplementationError = Boom.badImplementation(msg)
    badImplementationError.output.payload.origin = payloadOrigin
    return badImplementationError
  }
  return Boom.badImplementation('Unexpected response from GOV.UK pay API')
}

const getRetryError = (err, actionMessage, id, idTag = 'tid', payloadOrigin = GOVPAYFAIL.prePaymentRetry) => {
  console.error(`Error ${actionMessage} GOV.UK API service - ${idTag}: ${id}`, err)
  const badImplementationError = Boom.boomify(err, { statusCode: 500 })
  badImplementationError.output.payload.origin = payloadOrigin
  return badImplementationError
}

const getErrorMessage = async (method, response) => ({
  method,
  status: response.status,
  response: await response.json()
})

const getTransactionErrorMessage = async (transactionId, payload, response) => ({
  ...(await getErrorMessage('POST', response)),
  transactionId,
  payload
})

/**
 * Post prepared payment to the GOV.UK PAY API and handle the exceptions and results
 * @param preparedPayment - the prepared payload for the payment. See in processors/payment.js
 * @returns {Promise<*>}
 */
export const sendPayment = async preparedPayment => {
  let response
  try {
    response = await govUkPayApi.createPayment(preparedPayment)
  } catch (err) {
    /*
     * Potentially errors caught here (unreachable, timeouts) may be retried - set origin on the error to indicate
     * a prepayment error in the POST request
     */
    throw getRetryError(err, 'creating payment in the', preparedPayment.id)
  }

  if (response.ok) {
    const resBody = await response.json()
    debug('Successful payment creation response: %o', resBody)
    return resBody
  } else {
    const errMsg = await getTransactionErrorMessage(preparedPayment.id, preparedPayment, response)
    console.error('Failure creating payment in the GOV.UK API service', errMsg)

    /*
     * Detect the rate limit error and present the retry content. Otherwise throw the general server error
     */
    throw getErrorType(response, preparedPayment.id)
  }
}

/**
 * Get the payment status from the API for a payment id and handle errors
 * @param paymentId - the paymentId
 * @returns {Promise<any>}
 */
export const getPaymentStatus = async paymentId => {
  debug(`Get payment status for paymentId: ${paymentId}`)
  let response
  try {
    response = await govUkPayApi.fetchPaymentStatus(paymentId)
  } catch (err) {
    /*
     * Errors caught here (unreachable, timeouts) may be retried - set origin on the error to indicate
     * a post-payment error in the request
     */
    throw getRetryError(err, 'retrieving the payment status from the', paymentId, 'paymentId', GOVPAYFAIL.postPaymentRetry)
  }

  if (response.ok) {
    const resBody = await response.json()
    debug('Payment status response: %o', resBody)
    return resBody
  } else {
    const mes = {
      paymentId,
      ...(await getErrorMessage('GET', response))
    }
    console.error(`Error retrieving the payment status from the GOV.UK API service - tid: ${paymentId}`, mes)

    /*
     * Detect the rate limit error and present the retry content. Otherwise throw the general server error
     */
    throw getErrorType(response, paymentId, 'paymentId', GOVPAYFAIL.postPaymentRetry)
  }
}

const createRecurringPayment = async preparedPayment => {
  try {
    return await govUkPayApi.createRecurringPayment(preparedPayment)
  } catch (err) {
    /*
     * Potentially errors caught here (unreachable, timeouts) may be retried - set origin on the error to indicate
     * a prepayment error in the POST request
     */
    throw getRetryError(err, 'creating agreement in the', preparedPayment.user_identifier)
  }
}

export const sendRecurringPayment = async preparedPayment => {
  const response = await createRecurringPayment(preparedPayment)

  if (response.ok) {
    const resBody = await response.json()
    debug('Successful agreement creation response: %o', resBody)
    return resBody
  } else {
    const errMsg = await getTransactionErrorMessage(preparedPayment.reference, preparedPayment, response)
    console.error('Failure creating agreement in the GOV.UK API service', errMsg)

    /*
     * Detect the rate limit error and present the retry content. Otherwise throw the general server error
     */
    throw getErrorType(response, preparedPayment.id)
  }
}
