import rateLimitedFetch from '../rate-limited-fetch.js'
import fetch from 'node-fetch'

jest.mock('node-fetch', () => jest.fn(() => ({ status: 200 })))
// jest.spyOn(global, 'setTimeout')

describe('rateLimitedFetch', () => {
  beforeEach(jest.clearAllMocks)

  it.each`
    url                              | options
    ${'https://api.example.com'}     | ${{ method: 'GET' }}
    ${'https://another.example.com'} | ${{ method: 'POST', randomOption: Symbol('randomOption') }}
  `('passes request for $url with options `$options` to fetch', async ({ url, options }) => {
    await rateLimitedFetch(url, options)

    expect(fetch).toHaveBeenCalledWith(url, options)
  })

  it('returns the response from the fetch call', async () => {
    const url = 'https://api.example.com'
    const response = { status: Symbol('status') }
    fetch.mockResolvedValueOnce(response)

    const result = await rateLimitedFetch(url)

    expect(result).toBe(response)
  })

  it('retries the request after 1 second if a 429 response is received', async () => {
    jest.useFakeTimers()
    const url = 'https://api.example.com'
    fetch.mockResolvedValueOnce({ status: 429 })

    const fetchPromise = rateLimitedFetch(url)
    await fetch.mock.results[0].value // advance to response status handling...
    fetch.mockClear()
    jest.advanceTimersByTime(1000)
    await fetchPromise
    expect(fetch).toHaveBeenCalledWith(url)
    jest.useRealTimers()
  })

  describe.each([[[1, 2]], [[1, 2, 4]]])('Testing delays of %p seconds', delays => {
    it(`calls fetch ${delays.length + 1} times with expected arguments`, async () => {
      const realSetTimeout = global.setTimeout
      global.setTimeout = jest.fn(callback => callback())
      const url = 'https://api.example.com'
      const options = { method: 'POST', unique: Symbol('unique') }

      for (let x = 0; x < delays.length; x++) {
        fetch.mockResolvedValueOnce({ status: 429 })
      }

      await rateLimitedFetch(url, options)
      for (let x = 0; x <= delays.length; x++) {
        expect(fetch).toHaveBeenNthCalledWith(x + 1, url, options)
      }

      global.setTimeout = realSetTimeout
    })

    it(`calls setTimeout with delays of ${delays.join(', ')} seconds`, async () => {
      const realSetTimeout = global.setTimeout
      global.setTimeout = jest.fn(callback => callback())
      const url = 'https://api.example.com'

      for (let x = 0; x <= delays.length; x++) {
        fetch.mockResolvedValueOnce({ status: 429 })
      }

      await rateLimitedFetch(url)
      for (let x = 0; x < delays.length; x++) {
        expect(global.setTimeout).toHaveBeenNthCalledWith(x + 1, expect.any(Function), delays[x] * 1000)
      }

      global.setTimeout = realSetTimeout
    })

    it('calls setTimeout and fetch in expected sequency', async () => {
      const callSequence = []
      const realSetTimeout = global.setTimeout
      const url = 'https://api.example.com'
      global.setTimeout = jest.fn((callback, delay) => {
        callSequence.push({ setTimeout: [callback, delay] })
        callback()
      })

      for (let x = 0; x <= delays.length; x++) {
        fetch.mockImplementationOnce((...args) => {
          callSequence.push({ fetch: args })
          return { status: 429 }
        })
      }

      await rateLimitedFetch(url)

      expect(callSequence).toMatchSnapshot()
      global.setTimeout = realSetTimeout
    })
  })
})
