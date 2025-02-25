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

  _sendBatch (fetchRequests, position) {
    return fetchRequests.length === this._batchSize
  }

  async fetch () {
    const fetchRequests = []
    for (let position = 0; position < this._requests.length; position++) {
      fetchRequests.push(fetch(this._requests[position].url, this._requests[position].options))
      console.log('fetchRequests', fetchRequests)
      if (this._sendBatch(fetchRequests, position)) {
        this._responses.push(...(await Promise.all(fetchRequests)))
        if (position !== this._requests.length - 1) {
          // don't wait if this is the last batch
          await new Promise(resolve => setTimeout(() => resolve(), 1000))
        }
        fetchRequests.length = 0
      }
    }
  }
}

// todo:
// 1) process requests that don't form a complete batch ✅
// 2) responses has a bug where it only stores that last batch of responses ✅
// 3) if a 429 response is received, it should be retried in the next batch. Batch size should be reduced by 1 for each 429 response received
