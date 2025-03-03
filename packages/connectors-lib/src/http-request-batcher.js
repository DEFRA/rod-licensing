import fetch from 'node-fetch'
import db from 'debug'

const debug = db('connectors:http-request-batcher')
export default class HTTPRequestBatcher {
  constructor ({ batchSize = 50, delay = 1000 } = {}) {
    this._batchSize = batchSize
    this._delay = delay
    this._requests = []
    this._responses = []
  }

  get batchSize () {
    return this._batchSize
  }

  get requestQueue () {
    return this._requests
  }

  get responses () {
    return this._responses
  }

  get delay () {
    return this._delay
  }

  addRequest (url, options) {
    if (!url) {
      throw new Error('URL is required')
    }
    this._requests.push({ url, options })
  }

  _sendBatch (fetchRequests) {
    return fetchRequests.length === this._batchSize
  }

  async fetch () {
    debug(
      `Beginning batched fetch of ${this._requests.length} requests with initial batch size of ${this._batchSize} and delay between batches of ${this._delay}ms`
    )
    const requestQueue = [...this._requests]
    const sentRequests = []
    const fetchRequests = []
    while (requestQueue.length) {
      const request = requestQueue.shift()
      fetchRequests.push(fetch(request.url, request.options))
      sentRequests.push({ attempts: 1, ...request })
      if (this._sendBatch(fetchRequests)) {
        const batchResponses = await Promise.all(fetchRequests)
        this._responses.push(...batchResponses)
        for (let x = 0; x < batchResponses.length; x++) {
          const response = batchResponses[x]
          if (response.status === 429 && sentRequests[x].attempts < 2) {
            requestQueue.push({ ...sentRequests[x], attempts: sentRequests[x].attempts + 1 })
            this._batchSize = Math.max(this._batchSize - 1, 1)
            debug(`429 response received for ${sentRequests[x].url}, reducing batch size to ${this._batchSize}`)
          }
        }
        fetchRequests.length = 0
        sentRequests.length = 0
        if (requestQueue.length) {
          // don't wait if this is the last batch
          await new Promise(resolve => setTimeout(resolve, this._delay))
        }
      }
    }
    debug('Batched fetch complete')
  }
}
