/**
 * Make a requests to the GOV.UK Pay API
 */
import fetch from 'node-fetch'
const GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT = 10000

const headers = recurring => ({
  accept: 'application/json',
  authorization: `Bearer ${recurring ? process.env.GOV_PAY_RECURRING_APIKEY : process.env.GOV_PAY_APIKEY}`,
  'content-type': 'application/json'
})

/**
 * Create a new recurring payment
 * @param preparedPayment - see the GOV.UK pay API reference for details
 * @returns {Promise<*>}
 */
export const createRecurringPaymentAgreement = async preparedPayment => {
  try {
    return fetch(process.env.GOV_PAY_RCP_API_URL, {
      headers: headers(true),
      method: 'post',
      body: JSON.stringify(preparedPayment),
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    console.error(
      `Error creating recurring payment agreement in the GOV.UK API service - agreement: ${JSON.stringify(preparedPayment, null, 4)}`,
      err
    )
    throw err
  }
}

/**
 * Create a new payment
 * @param preparedPayment - see the GOV.UK pay API reference for details
 * @returns {Promise<*>}
 */
export const createPayment = async (preparedPayment, recurring = false) => {
  try {
    return fetch(process.env.GOV_PAY_API_URL, {
      headers: headers(recurring),
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
export const fetchPaymentStatus = async (paymentId, recurring = false) => {
  try {
    return fetch(`${process.env.GOV_PAY_API_URL}/${paymentId}`, {
      headers: headers(recurring),
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
export const fetchPaymentEvents = async (paymentId, recurring = false) => {
  try {
    return fetch(`${process.env.GOV_PAY_API_URL}/${paymentId}/events`, {
      headers: headers(recurring),
      method: 'get',
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    console.error(`Error retrieving the payment events from the GOV.UK API service - paymentId: ${paymentId}`, err)
    throw err
  }
}

export const isGovPayUp = async () => {
  try {
    return await fetch(process.env.GOV_PAY_HEALTH_CHECK_URL)
  } catch (err) {
    console.error('Error retrieving GovPay health status', err)
    throw err
  }
}

/**
 * Gets payment information linked too a payment
 * @param agreementId - agreementId set up when  creating recurring payment
 * @returns {Promise<*>}
 */
export const getRecurringPaymentAgreementInformation = async agreementId => {
  try {
    return fetch(`${process.env.GOV_PAY_RCP_API_URL}/${agreementId}`, {
      headers: headers(true),
      method: 'get',
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
  } catch (err) {
    console.error(`Error fetching recurring payment agreement information in the GOV.UK API service - agreementId: ${agreementId}`, err)
    throw err
  }
}
