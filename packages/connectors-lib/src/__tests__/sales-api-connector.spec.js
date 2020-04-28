import * as salesApi from '../sales-api-connector.js'
import each from 'jest-each'

jest.mock('node-fetch')
const fetch = require('node-fetch')
const TEST_HREF = 'http://example.com/'

describe('sales-api-connector', () => {
  beforeEach(jest.clearAllMocks)

  describe('call', () => {
    it('handles get requests', async () => {
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', json: async () => expectedResponse })
      await expect(salesApi.call(new URL(TEST_HREF))).resolves.toEqual({ status: 200, statusText: 'OK', body: expectedResponse })
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
    })
    it('handles post requests', async () => {
      const payload = { example: 'payload' }
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', json: async () => expectedResponse })
      await expect(salesApi.call(new URL(TEST_HREF), 'post', payload)).resolves.toEqual({
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
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', json: async () => expectedResponse })
      await expect(salesApi.call(new URL(TEST_HREF), 'patch', payload)).resolves.toEqual({
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
    it('throws on non-ok response', async () => {
      fetch.mockReturnValue({ ok: false, status: 404, statusText: 'Not Found', json: async () => {} })
      await expect(salesApi.call(new URL(TEST_HREF))).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 404.*"statusText": "Not Found"/s
      )
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
    })
    it('throws exceptions from fetch up the stack', async () => {
      fetch.mockRejectedValue(new Error('Request timeout'))
      await expect(salesApi.call(new URL(TEST_HREF))).rejects.toThrow(/Request timeout/)
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
    })
  })

  describe('createTransactions', () => {
    it('creates multiple transactions in batch', async () => {
      const transactions = ['a', 'b']
      const expectedResponse = [{}, {}]
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', json: async () => expectedResponse })
      await expect(salesApi.createTransactions(transactions)).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/transactions/$batch',
        expect.objectContaining({
          method: 'post',
          body: JSON.stringify(transactions)
        })
      )
    })
  })

  describe('finaliseTransaction', () => {
    it('finalises a transaction for the given id and payload', async () => {
      const transactionId = 'test_id'
      const payload = {
        payment: {
          amount: 30,
          timestamp: new Date().toISOString(),
          type: 'Gov Pay',
          method: 'Debit card'
        }
      }
      const expectedResponse = { messageId: 'example', status: 'queued' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', json: async () => expectedResponse })
      await expect(salesApi.finaliseTransaction(transactionId, payload)).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        `http://0.0.0.0:4000/transactions/${transactionId}`,
        expect.objectContaining({
          method: 'patch',
          body: JSON.stringify(payload)
        })
      )
    })
  })

  describe('reference data endpoints', () => {
    each(['permits', 'concessions', 'permitConcessions', 'transactionCurrencies']).describe(
      'allows %s to be queried with different methods',
      endpoint => {
        it('retrieves all items using .getAll()', async () => {
          const expectedResponse = [{ id: 'test-1' }, { id: 'test-2' }]
          fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', json: async () => expectedResponse })
          await expect(salesApi[endpoint].getAll()).resolves.toEqual(expectedResponse)
          expect(fetch).toHaveBeenCalledWith(`http://0.0.0.0:4000/${endpoint}?`, {
            method: 'get',
            headers: expect.any(Object),
            timeout: 20000
          })
        })

        it('allows items to be filtered using .getAll(criteria) ', async () => {
          const expectedResponse = [
            { id: 'test-1', set: '1' },
            { id: 'test-2', set: '1' }
          ]
          fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', json: async () => expectedResponse })
          await expect(salesApi[endpoint].getAll({ set: '1' })).resolves.toEqual(expectedResponse)
          expect(fetch).toHaveBeenCalledWith(`http://0.0.0.0:4000/${endpoint}?set=1`, {
            method: 'get',
            headers: expect.any(Object),
            timeout: 20000
          })
        })

        it('allows the first matching item to be found using .find(criteria)', async () => {
          const apiResponse = [
            { id: 'test-1', set: '1' },
            { id: 'test-2', set: '1' }
          ]
          const expectedResponse = { id: 'test-1', set: '1' }
          fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', json: async () => apiResponse })
          await expect(salesApi[endpoint].find({ set: '1' })).resolves.toEqual(expectedResponse)
          expect(fetch).toHaveBeenCalledWith(`http://0.0.0.0:4000/${endpoint}?set=1`, {
            method: 'get',
            headers: expect.any(Object),
            timeout: 20000
          })
        })

        it('returns undefined if no item could be found using .find(criteria)', async () => {
          fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', json: async () => [] })
          await expect(salesApi[endpoint].find({ set: '1' })).resolves.toEqual(undefined)
          expect(fetch).toHaveBeenCalledWith(`http://0.0.0.0:4000/${endpoint}?set=1`, {
            method: 'get',
            headers: expect.any(Object),
            timeout: 20000
          })
        })
      }
    )
  })
})
