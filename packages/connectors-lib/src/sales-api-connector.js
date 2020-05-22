import fetch from 'node-fetch'
import querystring from 'querystring'
const SALES_API_URL_DEFAULT = 'http://0.0.0.0:4000'
const SALES_API_TIMEOUT_MS_DEFAULT = 20000
const urlBase = process.env.SALES_API_URL || SALES_API_URL_DEFAULT
const headers = { 'Content-Type': 'application/json' }

export const call = async (url, method = 'get', payload = null) => {
  const response = await fetch(url.href, {
    headers,
    method,
    ...(payload && { body: JSON.stringify(payload) }),
    timeout: process.env.SALES_API_TIMEOUT_MS || SALES_API_TIMEOUT_MS_DEFAULT
  })

  const result = {
    status: response.status,
    statusText: response.statusText,
    body: await response.json()
  }

  if (response.ok) {
    return result
  }
  throw new Error(`Unexpected response from the Sales API: ${JSON.stringify(result, null, 2)}`)
}

export const createTransactions = async transactionArr =>
  (await call(new URL('/transactions/$batch', urlBase), 'post', transactionArr)).body
export const finaliseTransaction = async (id, transaction) =>
  (await call(new URL(`/transactions/${id}`, urlBase), 'patch', transaction)).body

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
    return (await call(new URL(`?${querystring.stringify(criteria)}`, this._baseUrl))).body
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

export const permits = new QueryBuilder(new URL('permits', urlBase))
export const concessions = new QueryBuilder(new URL('concessions', urlBase))
export const permitConcessions = new QueryBuilder(new URL('permitConcessions', urlBase))
export const transactionCurrencies = new QueryBuilder(new URL('transactionCurrencies', urlBase))
