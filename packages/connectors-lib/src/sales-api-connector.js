import fetch from 'node-fetch'
import querystring from 'querystring'
import db from 'debug'
const SALES_API_URL_DEFAULT = 'http://0.0.0.0:4000'
const SALES_API_TIMEOUT_MS_DEFAULT = 20000
const urlBase = process.env.SALES_API_URL || SALES_API_URL_DEFAULT
const debug = db('connectors:sales-api')

/**
 * Make a request to the sales API
 *
 * @param url the URL of the endpoint to make a request to
 * @param method the HTTP method (defaults to get)
 * @param payload the payload to include with a put/post/patch request
 * @returns {Promise<{statusText: *, ok: *, body: *, status: *}>}
 */
export const call = async (url, method = 'get', payload = null) => {
  const requestTimestamp = new Date().toISOString()
  const response = await fetch(url.href, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(payload && { body: JSON.stringify(payload) }),
    timeout: process.env.SALES_API_TIMEOUT_MS || SALES_API_TIMEOUT_MS_DEFAULT
  })
  const responseTimestamp = new Date().toISOString()
  const responseData = {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: response.status !== 204 ? await parseResponseBody(response) : undefined
  }
  debug(
    'Request sent (%s): %s %s with payload %o.  Response received (%s): %o',
    requestTimestamp,
    method,
    url.href,
    payload,
    responseTimestamp,
    responseData
  )
  return responseData
}

/**
 * Retrieve the response json, falling back to reading text on error
 *
 * @param response node-fetch response object
 * @returns {Promise<{}>}
 */
const parseResponseBody = async response => {
  const body = await response.text()
  try {
    return JSON.parse(body)
  } catch (e) {
    return {
      text: body
    }
  }
}

const exec2xxOrThrow = async requestPromise => {
  const response = await requestPromise
  if (response.ok) {
    return response.body
  }
  throw Object.assign(new Error(`Unexpected response from the Sales API: ${JSON.stringify(response, null, 2)}`), { ...response })
}

const exec2xxOrNull = async requestPromise => {
  const response = await requestPromise
  return (response.ok && response.body) || null
}

/**
 * Create a new transaction in the sales API
 *
 * @param transaction the payload for the request
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const createTransaction = async transaction => exec2xxOrThrow(call(new URL('/transactions', urlBase), 'post', transaction))

/**
 * Create new transactions in the sales API in batch mode
 *
 * @param transactionArr the array containing multiple transaction payloads
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const createTransactions = async transactionArr =>
  exec2xxOrThrow(call(new URL('/transactions/$batch', urlBase), 'post', transactionArr))

/**
 * Finalise a transaction in the sales API
 *
 * @param id the transaction id to finalise
 * @param payload the finalise-transaction payload to supply on the request
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const finaliseTransaction = async (id, payload) => exec2xxOrThrow(call(new URL(`/transactions/${id}`, urlBase), 'patch', payload))

/**
 * Retrieve the details of a transaction file.  Returns null if not found.
 *
 * @param filename the name of the transaction file record to retrieve
 * @returns {Promise<*|null>}
 */
export const getTransactionFile = async filename => exec2xxOrNull(call(new URL(`/transaction-files/${filename}`, urlBase), 'get'))

/**
 * Create/update a transaction file
 *
 * @param filename the name of the transaction file record to upsert
 * @param data the payload with which to update the transaction file record
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const upsertTransactionFile = async (filename, data) =>
  exec2xxOrThrow(call(new URL(`/transaction-files/${filename}`, urlBase), 'put', data))

/**
 * Create a payment journal
 *
 * @param data the payload with which to create the payment journal
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const createPaymentJournal = async (id, data) => exec2xxOrThrow(call(new URL(`/paymentJournals/${id}`, urlBase), 'put', data))

/**
 * Retrieve an existing payment journal
 *
 * @param {string} id the identifier of the payment journal to retrieve
 * @returns {Promise<*>}
 */
export const getPaymentJournal = async id => exec2xxOrNull(call(new URL(`/paymentJournals/${id}`, urlBase), 'get'))

/**
 * Update an existing payment journal
 *
 * @param {string} id the identifier of the payment journal to update
 * @param data the payload with which to update the payment journal
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const updatePaymentJournal = async (id, data) => exec2xxOrThrow(call(new URL(`/paymentJournals/${id}`, urlBase), 'patch', data))

/**
 * Create a new staging exception
 *
 * @param data the payload with which to create the staging exception
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const createStagingException = async data => exec2xxOrThrow(call(new URL('/stagingExceptions', urlBase), 'post', data))

/**
 * Retrieve all POCL validation errors which have a "Ready for processing" status
 *
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const getPoclValidationErrorsForProcessing = async () => exec2xxOrThrow(call(new URL('/poclValidationErrors', urlBase), 'get'))

/**
 * Update POCL validation error with the given id
 *
 * @param {string} id the identifier of the POCL validation error to update
 * @param data the payload with which to update the POCL validation error
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const updatePoclValidationError = async (id, data) =>
  exec2xxOrThrow(call(new URL(`/poclValidationErrors/${id}`, urlBase), 'patch', data))

/**
 * Retrieve details of a system user
 *
 * @param oid the Azure object ID pertaining to the system user
 * @returns {Promise<*>}
 */
export const getSystemUser = async oid => exec2xxOrNull(call(new URL(`/systemUsers/${oid}`, urlBase), 'get'))

/**
 * Supports querying of reference data from the Sales API
 */
class QueryBuilder {
  constructor (baseUrl) {
    this._baseUrl = baseUrl
  }

  /**
   * Retrieve all entries for the given criteria
   *
   * @param {Object} [criteria] an object whose fields are used to filter the results
   * @returns {Promise<*>}
   */
  async getAll (criteria) {
    return exec2xxOrThrow(call(new URL(`?${querystring.stringify(criteria)}`, this._baseUrl)))
  }

  /**
   * Find the first matching entity for the given criteria
   *
   * @param [criteria]
   * @returns {Promise<void>}
   */
  async find (criteria) {
    const result = await this.getAll(criteria)
    return (result.length && result[0]) || undefined
  }
}

/**
 * Query support for permits
 * @type {QueryBuilder}
 */
export const permits = new QueryBuilder(new URL('permits', urlBase))

/**
 * Query support for concessions
 * @type {QueryBuilder}
 */
export const concessions = new QueryBuilder(new URL('concessions', urlBase))

/**
 * Query support for permit-concession mappings
 * @type {QueryBuilder}
 */
export const permitConcessions = new QueryBuilder(new URL('permitConcessions', urlBase))

/**
 * Query support for transaction currencies
 * @type {QueryBuilder}
 */
export const transactionCurrencies = new QueryBuilder(new URL('transactionCurrencies', urlBase))

/**
 * Query support for payment journals
 * @type {QueryBuilder}
 */
export const paymentJournals = new QueryBuilder(new URL('paymentJournals', urlBase))

/**
 * Query support for country codes
 * @type {QueryBuilder}
 */
export const countries = new QueryBuilder(new URL('/option-sets/defra_country', urlBase))

/**
 * Support for easy-renewal authentication
 * @param referenceNumber
 * @param birthDate
 * @param postcode
 * @returns {Promise<*>}
 */
export const authenticate = async (referenceNumber, birthDate, postcode) =>
  exec2xxOrNull(
    call(
      new URL(
        `/authenticate/renewal/${referenceNumber}?${querystring.stringify({
          licenseeBirthDate: birthDate,
          licenseePostcode: postcode
        })}`,
        urlBase
      ),
      'get'
    )
  )

/**
 * Helper to check if an HTTP status code is classed as a system error
 *
 * @param {number} statusCode the HTTP status code to test
 * @returns {boolean} true if the status code represents a system error, false otherwise
 */
export const isSystemError = statusCode => Math.floor(statusCode / 100) === 5
