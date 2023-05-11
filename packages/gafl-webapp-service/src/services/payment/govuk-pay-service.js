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

/**
 * Post prepared payment to the GOV.UK PAY API and handle the exceptions and results
 * @param preparedPayment - the prepared payload for the payment. See in processors/payment.js
 * @returns {Promise<*>}
 */
export const sendPayment = async preparedPayment => {
  const badImplementationError = Boom.boomify(new Error(), { statusCode: 500 })
  badImplementationError.output.payload.origin = GOVPAYFAIL.prePaymentRetry
  throw badImplementationError
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
    console.error(`Error retrieving the payment status from the GOV.UK API service - paymentId: ${paymentId}`, err)
    const badImplementationError = Boom.boomify(err, { statusCode: 500 })
    badImplementationError.output.payload.origin = GOVPAYFAIL.postPaymentRetry
    throw badImplementationError
  }

  if (response.ok) {
    const resBody = await response.json()
    debug('Payment status response: %o', resBody)
    return resBody
  } else {
    const mes = {
      paymentId,
      method: 'GET',
      status: response.status,
      response: await response.json()
    }
    console.error(`Error retrieving the payment status from the GOV.UK API service - tid: ${paymentId}`, mes)

    /*
     * Detect the rate limit error and present the retry content. Otherwise throw the general server error
     */
    if (response.status === 429) {
      const msg = `GOV.UK Pay API rate limit breach - paymentId: ${paymentId}`
      console.info(msg)
      const badImplementationError = Boom.badImplementation(msg)
      badImplementationError.output.payload.origin = GOVPAYFAIL.postPaymentRetry
      throw badImplementationError
    } else {
      throw Boom.badImplementation('Unexpected response from GOV.UK pay API')
    }
  }
}
