/**
 * Make a requests to the GOV.UK Pay API
 */
import fetch from 'node-fetch'
const GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT = 10000

const headers = () => ({
  accept: 'application/json',
  authorization: `Bearer ${process.env.GOV_PAY_APIKEY}`,
  'content-type': 'application/json'
})

/**
 * Create a new payment
 * @param preparedPayment - see the GOV.UK pay API reference for details
 * @returns {Promise<*>}
 */
export const createPayment = async preparedPayment => {
  try {
    return fetch(process.env.GOV_PAY_API_URL, {
      headers: headers(),
      method: 'post',
      body: JSON.stringify(preparedPayment),
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    console.error(`Error creating payment in the GOV.UK API service - payment: ${JSON.stringify(preparedPayment, null, 4)}`, err)
    throw err
  }
}

/**
 * Fetch a payment status for a given paymentId
 * @param paymentId
 * @returns {Promise<unknown>}
 */
export const fetchPaymentStatus = async paymentId => {
  try {
    return fetch(`${process.env.GOV_PAY_API_URL}/${paymentId}`, {
      headers: headers(),
      method: 'get',
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    console.error(`Error retrieving the payment status from the GOV.UK API service - paymentId: ${paymentId}`, err)
    throw err
  }
}

/**
 * Fetch a payment events for a given paymentId
 * @param paymentId
 * @returns {Promise<unknown>}
 */
export const fetchPaymentEvents = async paymentId => {
  try {
    return fetch(`${process.env.GOV_PAY_API_URL}/${paymentId}/events`, {
      headers: headers(),
      method: 'get',
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    console.error(`Error retrieving the payment events from the GOV.UK API service - paymentId: ${paymentId}`, err)
    throw err
  }
}
