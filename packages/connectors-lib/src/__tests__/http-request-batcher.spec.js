import HTTPRequestBatcher from '../http-request-batcher.js'
import fetch from 'node-fetch'

jest.mock('node-fetch', () => jest.fn(() => ({ status: 200 })))

describe('HTTP Request Batcher', () => {
  beforeEach(jest.clearAllMocks)

  it('initialises with a default batch size of 10', () => {
    const batcher = new HTTPRequestBatcher()
    expect(batcher.batchSize).toBe(10)
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
    const batcher = new HTTPRequestBatcher(5)
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
    const batcher = new HTTPRequestBatcher(2)
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
    const batcher = new HTTPRequestBatcher(2)
    const url = 'https://api.example.com'
    const options = { method: 'GET' }

    for (let x = 0; x < 2; x++) {
      batcher.addRequest(url, options)
    }
    await batcher.fetch()

    expect(batcher.responses).toEqual([{ status: 200 }, { status: 200 }])
  })

  // describe.each([
  //   3, 10, 53, 126
  // ])('batch size %i', batchSize => {

  //   it.skip("doesn't make a request before batch size is reached", async () => {
  //     const batcher = new HTTPRequestBatcher(batchSize)
  //     const url = 'https://api.example.com'
  //     const options = { method: 'GET' }

  //     for (let x = 0; x < batchSize - 1; x++) {
  //       await batcher.addRequest(url, options)
  //     }
  //     expect(fetch).not.toHaveBeenCalled()
  //   })

  //   it.skip("makes a request once the batch size is reached", async () => {
  //     const batcher = new HTTPRequestBatcher(batchSize)
  //     const url = 'https://api.example.com'
  //     const options = { method: 'GET' }

  //     for (let x = 0; x < batchSize; x++) {
  //       await batcher.addRequest(url, options)
  //     }

  //     expect(fetch).toHaveBeenCalledTimes(batchSize)
  //     for (let x = 0; x < batchSize; x++) {
  //       expect(fetch).toHaveBeenNthCalledWith(x + 1, url, options)
  //     }
  //   })
  // })

  describe('pausing requests', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.spyOn(global, 'setTimeout')
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    const setupBatcherAndAddRequest = () => {
      const batcher = new HTTPRequestBatcher(1)
      batcher.addRequest('https://api.example.com')
      batcher.addRequest('https://alt-api.example.com')
      return batcher
    }

    it('delays for one second', async () => {
      const batcher = setupBatcherAndAddRequest()
      batcher.fetch()
      await Promise.all(fetch.mock.results.map(r => r.value))
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000)
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
      const batcher = new HTTPRequestBatcher(1)
      batcher.addRequest('https://api.example.com')
      await batcher.fetch()
      expect(setTimeout).not.toHaveBeenCalled()
    })
  })
})
