import * as sqs from '../sqs-connector.js'
import fetch from 'node-fetch'

jest.mock('node-fetch')

describe('sqs-connector', () => {
  beforeEach(jest.clearAllMocks)

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
      expect(fetch).toHaveBeenCalledWith('https://0.0.0.0:4000/receiver', {
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
      expect(fetch).toHaveBeenCalledWith('https://0.0.0.0:4000/receiver', {
        method: 'post',
        headers: expect.any(Object),
        timeout: 20000
      })
    })
  })
})
