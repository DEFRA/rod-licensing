import fetch from 'node-fetch'
import db from 'debug'
import { StatusCodes } from 'http-status-codes'

const debug = db('connectors:http-request-batcher')
export default class HTTPRequestBatcher {
  maxRequestAttempts = 2
  #batchSize
  #delay
  #requests = []
  #responseDetails = []

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

  get responseDetails () {
    return this.#responseDetails
  }

  get delay () {
    return this.#delay
  }

  addRequest (url, options, reference = null) {
    if (!url) {
      throw new Error('URL is required')
    }
    this.#requests.push({
      url,
      options,
      reference,
      responses: []
    })
  }

  async #processBatch (fetchRequests, requestQueue) {
    for (const fetchRequest of fetchRequests) {
      const response = await (async () => {
        try {
          return await fetchRequest.responsePromise
        } catch (e) {
          return e
        }
      })()
      fetchRequest.responses.push(response)
      if (
        fetchRequest.responses.at(-1).status === StatusCodes.TOO_MANY_REQUESTS &&
        fetchRequest.responses.length < this.maxRequestAttempts
      ) {
        requestQueue.push(fetchRequest)
        this.#batchSize = Math.max(this.#batchSize - 1, 1)
        debug(`${StatusCodes.TOO_MANY_REQUESTS} response received for ${fetchRequest.url}, reducing batch size to ${this.#batchSize}`)
      }
      if (!this.#responseDetails.includes(fetchRequest)) {
        this.#responseDetails.push(fetchRequest)
      }
    }
    fetchRequests.length = 0
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
    const fetchRequests = []
    while (requestQueue.length) {
      const request = requestQueue.shift()
      request.responsePromise = fetch(request.url, request.options)
      fetchRequests.push(request)
      if (fetchRequests.length === this.#batchSize || requestQueue.length === 0) {
        await this.#processBatch(fetchRequests, requestQueue)
      }
    }
    debug('Batched fetch complete')
  }
}
