import fetch from 'node-fetch'
import db from 'debug'
const SALES_API_URL_DEFAULT = 'http://0.0.0.0:4000'
const SALES_API_TIMEOUT_MS_DEFAULT = 20000
const urlBase = process.env.SALES_API_URL || SALES_API_URL_DEFAULT
const debug = db('connectors:sales-api')

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

const exec2xxOrThrow = async requestPromise => {
  const response = await requestPromise
  if (response.ok) {
    return response.body
  }
  throw Object.assign(new Error(`Unexpected response from the Sales API: ${JSON.stringify(response, null, 2)}`), { ...response })
}

/**
 * Retrieve all POCL validation errors which have a "Ready for processing" status
 *
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const getPoclValidationErrorsForProcessing = async () => exec2xxOrThrow(call(new URL('/dataValidationErrors', urlBase), 'get'))
