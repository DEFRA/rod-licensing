import fetch from 'node-fetch'
import db from 'debug'
import { StatusCodes } from 'http-status-codes'

const debug = db('connectors:http-request-batcher')
export default class HTTPRequestBatcher {
  #batchSize
  #delay
  #requests = []
  #responses = []

  constructor ({ batchSize = 50, delay = 1000 } = {}) {
    this.#batchSize = batchSize
    this.#delay = delay
  }

  get batchSize () {
    return this.#batchSize
  }

  get requestQueue () {
    return this.#requests
  }

  get responses () {
    return this.#responses
  }

  get delay () {
    return this.#delay
  }

  addRequest (url, options) {
    if (!url) {
      throw new Error('URL is required')
    }
    this.#requests.push({ url, options })
  }

  async _sendBatch (fetchRequests, sentRequests, requestQueue) {
    const batchResponses = await Promise.all(fetchRequests)
    this.#responses.push(...batchResponses)
    for (let x = 0; x < batchResponses.length; x++) {
      const response = batchResponses[x]
      if (response.status === StatusCodes.TOO_MANY_REQUESTS && sentRequests[x].attempts < 2) {
        requestQueue.push({ ...sentRequests[x], attempts: sentRequests[x].attempts + 1 })
        this.#batchSize = Math.max(this.#batchSize - 1, 1)
        debug(`429 response received for ${sentRequests[x].url}, reducing batch size to ${this.#batchSize}`)
      }
    }
    fetchRequests.length = 0
    sentRequests.length = 0
    if (requestQueue.length) {
      // don't wait if this is the last batch
      await new Promise(resolve => setTimeout(resolve, this.#delay))
    }
  }

  async fetch () {
    debug(
      `Beginning batched fetch of ${this.#requests.length} requests with initial batch size of ${
        this.#batchSize
      } and delay between batches of ${this.#delay}ms`
    )
    const requestQueue = [...this.#requests]
    const sentRequests = []
    const fetchRequests = []
    while (requestQueue.length) {
      const request = requestQueue.shift()
      fetchRequests.push(fetch(request.url, request.options))
      sentRequests.push({ attempts: 1, ...request })
      if (fetchRequests.length === this.#batchSize) {
        await this._sendBatch(fetchRequests, sentRequests, requestQueue)
      }
    }
    debug('Batched fetch complete')
  }
}
