import db from 'debug'
import Boom from '@hapi/boom'

import { GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT, GOVPAYFAIL } from '../../constants.js'
import { AGREED } from '../../uri.js'
import fetch from 'node-fetch'

/**
 * Interface to the GOV.UK Pay API
 */
const debug = db('webapp:govuk-pay-service')

const headers = {
  accept: 'application/json',
  authorization: `Bearer ${process.env.GOV_PAY_APIKEY}`,
  'content-type': 'application/json'
}

const GOVPAY_STATUS_CODES = {
  REJECTED: 'P0010',
  EXPIRED: 'P0020',
  USER_CANCELLED: 'P0030',
  ERROR: 'P0050'
}

const preparePayment = transaction => {
  const result = {
    return_url: new URL(
      AGREED.uri, // The cookie is lost if we redirect from another domain so use this intermediate handler
      `${process.env.GOV_PAY_HTTPS_REDIRECT === 'true' ? 'https' : 'http'}:\\${process.env.HOST_URL || '0.0.0.0:3000'}`
    ).href,
    amount: transaction.cost * 100,
    reference: transaction.id,
    description: transaction.permissions.length === 1 ? transaction.permissions[0].permit.description : 'Multiple permits',
    delayed_capture: false
  }

  if (transaction.permissions.length === 1) {
    result.email = transaction.permissions[0].licensee.email
    result.cardholder_name = `${transaction.permissions[0].licensee.firstName} ${transaction.permissions[0].licensee.lastName}`
    result.billing_address = {
      line1: transaction.permissions[0].licensee.premises + ' ' + transaction.permissions[0].licensee.street,
      line2: transaction.permissions[0].licensee.locality,
      postcode: transaction.permissions[0].licensee.postcode,
      city: transaction.permissions[0].licensee.town,
      country: transaction.permissions[0].licensee.countryCode
    }
  }

  debug('Creating prepared payment %O', result)
  return result
}

const postData = async preparedPayment => {
  const url = process.env.GOV_PAY_API_URL
  debug(`Post new payment to ${url}`)
  let response
  try {
    response = await fetch(url, {
      headers,
      method: 'post',
      body: JSON.stringify(preparedPayment),
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    /*
     * Potentially errors caught here (unreachable, timeouts) may be retried - set origin on the error to indicate
     * a prepayment error in the POST request
     */
    console.error(`Error creating payment in the GOV.UK API service - tid: ${preparedPayment.id}`, err)
    const badImplementationError = Boom.boomify(err, { statusCode: 500 })
    badImplementationError.output.payload.origin = GOVPAYFAIL.prePaymentRetry
    throw badImplementationError
  }

  if (response.ok) {
    const res = await response.json()
    debug('Successful payment creation response: %O', res)
    return res
  } else {
    const mes = {
      tid: preparedPayment.id,
      method: 'POST',
      payload: preparedPayment,
      status: response.status,
      response: await response.json()
    }
    console.error('Failure creating payment in the GOV.UK API service', mes)

    /*
     * Detect the rate limit error and present the retry content. Otherwise throw the general server error
     */
    if (response.status === 429) {
      const msg = `GOV.UK Pay API rate limit breach - tid: ${preparedPayment.id}`
      console.info(msg)
      const badImplementationError = Boom.badImplementation(msg)
      badImplementationError.output.payload.origin = GOVPAYFAIL.prePaymentRetry
      throw badImplementationError
    } else {
      throw Boom.badImplementation('Unexpected response from GOV.UK pay API')
    }
  }
}

const getGovUkPaymentStatus = async (url, id) => {
  debug(`Get payment status: ${url}`)
  let response
  try {
    response = await fetch(url, {
      headers,
      method: 'get',
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    /*
     * Errors caught here (unreachable, timeouts) may be retried - set origin on the error to indicate
     * a post-payment error in the request
     */
    console.error(`Error retrieving the payment status from the GOV.UK API service - tid: ${id}`, err)
    const badImplementationError = Boom.boomify(err, { statusCode: 500 })
    badImplementationError.output.payload.origin = GOVPAYFAIL.postPaymentRetry
    throw badImplementationError
  }

  if (response.ok) {
    const res = await response.json()
    debug('Payment status response: %O', res)
    return res
  } else {
    const mes = {
      tid: id,
      method: 'GET',
      status: response.status,
      response: await response.json()
    }
    console.error(`Error retrieving the payment status from the GOV.UK API service - tid: ${id}`, mes)

    /*
     * Detect the rate limit error and present the retry content. Otherwise throw the general server error
     */
    if (response.status === 429) {
      const msg = `GOV.UK Pay API rate limit breach - tid: ${id}`
      console.info(msg)
      const badImplementationError = Boom.badImplementation(msg)
      badImplementationError.output.payload.origin = GOVPAYFAIL.postPaymentRetry
      throw badImplementationError
    } else {
      throw Boom.badImplementation('Unexpected response from GOV.UK pay API')
    }
  }
}

export { preparePayment, postData, getGovUkPaymentStatus, GOVPAY_STATUS_CODES }
