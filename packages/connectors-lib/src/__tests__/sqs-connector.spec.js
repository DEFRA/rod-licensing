import * as sqs from '../sqs-connector.js'
import fetch from 'node-fetch'

jest.mock('node-fetch')
const TEST_HREF = 'http://example.com/'

describe('sqs-connector', () => {
  beforeEach(jest.clearAllMocks)

  describe('call', () => {
    it('handles get requests with a 200 response', async () => {
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(sqs.call(new URL(TEST_HREF))).resolves.toEqual({ ok: true, status: 200, statusText: 'OK', body: expectedResponse })
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
    })

    it('handles get requests with a 204 response', async () => {
      const expectedResponse = undefined
      fetch.mockReturnValue({ ok: true, status: 204, statusText: 'No Content', text: async () => JSON.stringify(expectedResponse) })
      await expect(sqs.call(new URL(TEST_HREF))).resolves.toEqual({
        ok: true,
        status: 204,
        statusText: 'No Content',
        body: expectedResponse
      })
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
    })

    it('handles post requests', async () => {
      const payload = { example: 'payload' }
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(sqs.call(new URL(TEST_HREF), 'post', payload)).resolves.toEqual({
        ok: true,
        status: 200,
        statusText: 'OK',
        body: expectedResponse
      })
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, {
        method: 'post',
        headers: expect.any(Object),
        body: JSON.stringify(payload),
        timeout: 20000
      })
    })

    it('handles patch requests', async () => {
      const payload = { example: 'payload' }
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(sqs.call(new URL(TEST_HREF), 'patch', payload)).resolves.toEqual({
        ok: true,
        status: 200,
        statusText: 'OK',
        body: expectedResponse
      })
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, {
        method: 'patch',
        headers: expect.any(Object),
        body: JSON.stringify(payload),
        timeout: 20000
      })
    })

    it('returns necessary information on a non-ok response', async () => {
      fetch.mockReturnValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => JSON.stringify({ error: 'Description' }) })
      await expect(sqs.call(new URL(TEST_HREF))).resolves.toEqual({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        body: {
          error: 'Description'
        }
      })
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
    })

    it('parses response text if a json response cannot be parsed', async () => {
      const textResponseMethod = jest.fn(async () => 'Text response')
      fetch.mockReturnValue({ ok: false, status: 404, statusText: 'Not Found', text: textResponseMethod })
      await expect(sqs.call(new URL(TEST_HREF))).resolves.toEqual({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        body: {
          text: 'Text response'
        }
      })
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
      expect(textResponseMethod).toHaveBeenCalled()
    })

    it('throws exceptions from fetch up the stack', async () => {
      fetch.mockRejectedValue(new Error('Request timeout'))
      await expect(sqs.call(new URL(TEST_HREF))).rejects.toThrow(/Request timeout/)
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
    })
  })

  describe('receiver', () => {
    it('calls the endpoint and returns the expected response', async () => {
      const expectedResponse = { success: true }
      fetch.mockReturnValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(expectedResponse)
      })

      await expect(sqs.receiver()).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0:4000/receiver', {
        method: 'post',
        headers: expect.any(Object),
        timeout: 20000
      })
    })

    it('throws an error on non-2xx response', async () => {
      fetch.mockReturnValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server Error'
      })

      await expect(sqs.receiver()).rejects.toThrow('Internal Server Error')
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0:4000/receiver', {
        method: 'post',
        headers: expect.any(Object),
        timeout: 20000
      })
    })
  })
})
