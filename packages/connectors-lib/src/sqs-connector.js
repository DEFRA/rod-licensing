import { call } from './sales-api-connector.js'
const SQS_RECIEVER_URL_DEFAULT = 'https://0.0.0.0:4000'
const urlBase = process.env.SQS_RECIEVER_URL || SQS_RECIEVER_URL_DEFAULT

const exec2xxOrThrow = async requestPromise => {
  const response = await requestPromise
  if (response.ok) {
    return response.body
  }
  throw Object.assign(new Error(`Unexpected response from the SQS Receiver: ${JSON.stringify(response, null, 2)}`), { ...response })
}

/**
 * POST request to the SQS receiver endpoint to trigger the receiver process
 *
 * @returns {Promise<*>}
 * @throws on a non-2xx response
 */
export const receiver = async () => exec2xxOrThrow(call(new URL('/receiver', urlBase), 'post'))
