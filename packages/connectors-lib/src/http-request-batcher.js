import fetch from 'node-fetch'

export default class HTTPRequestBatcher {
  constructor (batchSize = 10) {
    this._batchSize = batchSize
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
          }
        }
        fetchRequests.length = 0
        sentRequests.length = 0
        if (requestQueue.length) {
          // don't wait if this is the last batch
          await new Promise(resolve => setTimeout(() => resolve(), 1000))
        }
      }
    }
  }
}

// todo:
// 1) process requests that don't form a complete batch ✅
// 2) responses has a bug where it only stores that last batch of responses ✅
// 3) if a 429 response is received, it should be retried in the next batch. Batch size should be reduced by 1 for each 429 response received
