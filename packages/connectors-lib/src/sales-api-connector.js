import fetch from 'node-fetch'
import querystring from 'querystring'
const SALES_API_URL_DEFAULT = 'http://0.0.0.0:4000'
const SALES_API_TIMEOUT_MS_DEFAULT = 20000
const urlBase = process.env.SALES_API_URL || SALES_API_URL_DEFAULT
const headers = { 'Content-Type': 'application/json' }

/**
 * Make a request to the sales API
 *
 * @param url the URL of the endpoint to make a request to
 * @param method the HTTP method (defaults to get)
 * @param payload the payload to include with a put/post/patch request
 * @returns {Promise<{statusText: *, ok: *, body: *, status: *}>}
 */
export const call = async (url, method = 'get', payload = null) => {
  const response = await fetch(url.href, {
    headers,
    method,
    ...(payload && { body: JSON.stringify(payload) }),
    timeout: process.env.SALES_API_TIMEOUT_MS || SALES_API_TIMEOUT_MS_DEFAULT
  })

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: response.status !== 204 ? await response.json() : undefined
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
 * @throws on a non-2xx response
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
 * Delete an existing payment journal
 *
 * @param {string} id the identifier of the payment journal to update
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const deletePaymentJournal = async id => exec2xxOrThrow(call(new URL(`/paymentJournals/${id}`, urlBase), 'delete'))

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
   * @param {Object} criteria an object whose fields are used to filter the results
   * @returns {Promise<*>}
   */
  async getAll (criteria) {
    return exec2xxOrThrow(call(new URL(`?${querystring.stringify(criteria)}`, this._baseUrl)))
  }

  /**
   * Find the first matching entity for the given criteria
   *
   * @param criteria
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
