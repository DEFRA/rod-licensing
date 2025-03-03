import HTTPRequestBatcher from '../http-request-batcher.js'
import fetch from 'node-fetch'
import db from 'debug'
const [{ value: debug }] = db.mock.results

jest.mock('node-fetch', () => jest.fn(() => ({ status: 200 })))
jest.mock('debug', () => jest.fn(() => jest.fn()))

describe('HTTP Request Batcher', () => {
  beforeEach(jest.clearAllMocks)

  it('initialises debug with the expected namespace', () => {
    jest.isolateModules(() => {
      const debug = require('debug')
      require('../http-request-batcher.js')
      expect(debug).toHaveBeenCalledWith('connectors:http-request-batcher')
    })
  })

  it('initialises with a default batch size of 10', () => {
    const batcher = new HTTPRequestBatcher()
    expect(batcher.batchSize).toBe(50)
  })

  it('initialises with a default delay of 1000ms', () => {
    const batcher = new HTTPRequestBatcher()
    expect(batcher.delay).toBe(1000)
  })

  it('initialises with an empty request queue', () => {
    const batcher = new HTTPRequestBatcher()
    expect(batcher.requestQueue).toEqual([])
  })

  it('initialises with an empty response queue', () => {
    const batcher = new HTTPRequestBatcher()
    expect(batcher.responses).toEqual([])
  })

  it('initialises with a custom batch size', () => {
    const batcher = new HTTPRequestBatcher({ batchSize: 5 })
    expect(batcher.batchSize).toBe(5)
  })

  it('adds a request to the queue', () => {
    const batcher = new HTTPRequestBatcher()

    batcher.addRequest('https://api-one.example.com', { method: 'GET' })
    batcher.addRequest('https://api-b.example.com', { method: 'POST' })
    batcher.addRequest('https://api-three.example.com', { method: 'PUT' })

    expect(batcher.requestQueue).toEqual([
      { url: 'https://api-one.example.com', options: { method: 'GET' } },
      { url: 'https://api-b.example.com', options: { method: 'POST' } },
      { url: 'https://api-three.example.com', options: { method: 'PUT' } }
    ])
  })

  it('throws an error if url is not provided when adding a request', () => {
    const batcher = new HTTPRequestBatcher()
    expect(() => batcher.addRequest()).toThrow('URL is required')
  })

  it('calls fetch for each item in the queue', async () => {
    const batcher = new HTTPRequestBatcher(3)

    batcher.addRequest('https://api-one.example.com', { method: 'GET' })
    batcher.addRequest('https://api-b.example.com', { method: 'POST' })
    batcher.addRequest('https://api-three.example.com', { method: 'PUT' })
    await batcher.fetch()

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://api-one.example.com', { method: 'GET' })
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://api-b.example.com', { method: 'POST' })
    expect(fetch).toHaveBeenNthCalledWith(3, 'https://api-three.example.com', { method: 'PUT' })
  })

  it('makes multiple requests in parallel', () => {
    const batcher = new HTTPRequestBatcher({ batchSize: 2 })
    const url = 'https://api.example.com'
    const options = { method: 'GET' }

    for (let x = 0; x < 2; x++) {
      fetch.mockImplementationOnce(() => new Promise(() => {})) // return unresolved promises so we can check for parallel calls
      batcher.addRequest(url, options)
    }
    batcher.fetch()

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('populates responses property after fetch succeeds', async () => {
    const batcher = new HTTPRequestBatcher({ batchSize: 2 })
    const url = 'https://api.example.com'
    const options = { method: 'GET' }

    for (let x = 0; x < 2; x++) {
      batcher.addRequest(url, options)
    }
    await batcher.fetch()

    expect(batcher.responses).toEqual([{ status: 200 }, { status: 200 }])
  })

  describe('multiple batches', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.spyOn(global, 'setTimeout')
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    const setupBatcherAndAddRequest = (batcherArgs = {}) => {
      const batcher = new HTTPRequestBatcher({ batchSize: 1, ...batcherArgs })
      batcher.addRequest('https://api.example.com')
      batcher.addRequest('https://alt-api.example.com')
      return batcher
    }

    it.each([1000, 100, 380, 4826])('delays for %ims between batches', async delay => {
      const batcher = setupBatcherAndAddRequest({ delay })
      batcher.fetch()
      await Promise.all(fetch.mock.results.map(r => r.value))
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), delay)
    })

    it("second fetch isn't made immediately", async () => {
      const batcher = setupBatcherAndAddRequest()
      batcher.fetch()
      await Promise.all(fetch.mock.results.map(r => r.value))
      expect(fetch).not.toHaveBeenCalledWith('https://alt-api.example.com', expect.any(Object))
    })

    it('second batch is fetched after a one second delay', async () => {
      const batcher = setupBatcherAndAddRequest()
      const fetchPromise = batcher.fetch()
      await Promise.all(fetch.mock.results.map(r => r.value))
      jest.advanceTimersByTime(1000)
      await fetchPromise
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenCalledWith('https://alt-api.example.com', undefined)
    })

    it("doesn't pause if it's the last batch", async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 1 })
      batcher.addRequest('https://api.example.com')
      await batcher.fetch()
      expect(setTimeout).not.toHaveBeenCalled()
    })

    it("sends final batch if it doesn't form a full batch", async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 2 })
      for (let x = 0; x < 3; x++) {
        batcher.addRequest('https://api.example.com')
      }
      const batchPromise = batcher.fetch()
      await Promise.all(fetch.mock.results.map(r => r.value))
      jest.runAllTimers()
      await batchPromise
      expect(fetch).toHaveBeenCalledTimes(3)
    })

    it('stores all responses', async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 1 })
      batcher.addRequest('https://api.example.com')
      batcher.addRequest('https://alt-api.example.com')
      global.setTimeout.mockImplementationOnce(cb => cb())
      await batcher.fetch()
      expect(batcher.responses).toEqual([{ status: 200 }, { status: 200 }])
    })

    it('retries requests that received a 429 response', async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 1 })
      fetch.mockImplementationOnce(() => ({ status: 429 }))
      batcher.addRequest('https://api.example.com')
      global.setTimeout.mockImplementationOnce(cb => cb())
      await batcher.fetch()
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('retries requests with the same options as the original request', async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 3 })
      fetch.mockResolvedValueOnce({ status: 200 }).mockResolvedValueOnce({ status: 429 })
      batcher.addRequest('https://api.example.com')
      const sampleOptions = { method: 'POST', body: Symbol('body') }
      batcher.addRequest('https://alt-api.example.com', sampleOptions)
      batcher.addRequest('https://api-three.example.com')
      batcher.addRequest('https://api-four.example.com')
      global.setTimeout.mockImplementationOnce(cb => cb())
      await batcher.fetch()
      expect(fetch).toHaveBeenNthCalledWith(5, 'https://alt-api.example.com', sampleOptions)
    })

    it('adjusts batch size if a 429 response is received', async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 3 })
      fetch.mockImplementationOnce(() => ({ status: 429 }))
      batcher.addRequest('https://api.example.com')
      batcher.addRequest('https://alt-api.example.com')
      batcher.addRequest('https://api-three.example.com')
      global.setTimeout.mockImplementationOnce(cb => cb())
      await batcher.fetch()
      expect(batcher.batchSize).toBe(2)
    })

    it('logs if batch size is reduced', async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 3 })
      fetch.mockImplementationOnce(() => ({ status: 429 }))
      batcher.addRequest('https://api.example.com')
      batcher.addRequest('https://alt-api.example.com')
      batcher.addRequest('https://api-three.example.com')
      global.setTimeout.mockImplementationOnce(cb => cb())
      await batcher.fetch()
      expect(debug).toHaveBeenCalledWith('429 response received for https://api.example.com, reducing batch size to 2')
    })

    it('logs at start of fetch', async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 3 })
      batcher.addRequest('https://api.example.com')
      batcher.addRequest('https://api.example.com')
      batcher.addRequest('https://api.example.com')
      batcher.addRequest('https://api.example.com')
      global.setTimeout.mockImplementationOnce(cb => cb())
      await batcher.fetch()
      expect(debug).toHaveBeenCalledWith(
        'Beginning batched fetch of 4 requests with initial batch size of 3 and delay between batches of 1000ms'
      )
    })

    it("doesn't reduce batch size below 1", async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 1 })
      fetch.mockImplementationOnce(() => ({ status: 429 }))
      batcher.addRequest('https://api.example.com')
      global.setTimeout.mockImplementationOnce(cb => cb())
      await batcher.fetch()
      expect(batcher.batchSize).toBe(1)
    })

    it('only retry once if a 429 response is received again', async () => {
      const batcher = new HTTPRequestBatcher({ batchSize: 1 })
      fetch.mockResolvedValueOnce({ status: 429 }).mockResolvedValueOnce({ status: 429 })
      batcher.addRequest('https://api.example.com')
      global.setTimeout.mockImplementation(cb => cb())
      await batcher.fetch()
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })
})
