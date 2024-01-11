import * as salesApi from '../sales-api-connector.js'
import fetch from 'node-fetch'

jest.mock('node-fetch')
const TEST_HREF = 'http://example.com/'

describe('sales-api-connector', () => {
  beforeEach(jest.clearAllMocks)

  describe('call', () => {
    it('handles get requests with a 200 response', async () => {
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.call(new URL(TEST_HREF))).resolves.toEqual({ ok: true, status: 200, statusText: 'OK', body: expectedResponse })
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
    })

    it('handles get requests with a 204 response', async () => {
      const expectedResponse = undefined
      fetch.mockReturnValue({ ok: true, status: 204, statusText: 'No Content', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.call(new URL(TEST_HREF))).resolves.toEqual({
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
      await expect(salesApi.call(new URL(TEST_HREF), 'post', payload)).resolves.toEqual({
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
      await expect(salesApi.call(new URL(TEST_HREF), 'patch', payload)).resolves.toEqual({
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
      await expect(salesApi.call(new URL(TEST_HREF))).resolves.toEqual({
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
      await expect(salesApi.call(new URL(TEST_HREF))).resolves.toEqual({
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
      await expect(salesApi.call(new URL(TEST_HREF))).rejects.toThrow(/Request timeout/)
      expect(fetch).toHaveBeenCalledWith(TEST_HREF, { method: 'get', headers: expect.any(Object), timeout: 20000 })
    })
  })

  describe('createTransaction', () => {
    it('creates a single transaction', async () => {
      const transaction = { some: 'data' }
      const expectedResponse = { a: 'response' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.createTransaction(transaction)).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/transactions',
        expect.objectContaining({
          method: 'post',
          body: JSON.stringify(transaction)
        })
      )
    })
    it('throws on a non-ok response', async () => {
      const transaction = { some: 'data' }
      fetch.mockReturnValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => JSON.stringify({ error: 'Description' }) })
      await expect(salesApi.createTransaction(transaction)).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 404.*"statusText": "Not Found"/s
      )
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/transactions',
        expect.objectContaining({
          method: 'post',
          body: JSON.stringify(transaction)
        })
      )
    })
  })

  describe('createTransactions', () => {
    it('creates multiple transactions in batch', async () => {
      const transactions = ['a', 'b']
      const expectedResponse = [{}, {}]
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.createTransactions(transactions)).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/transactions/$batch',
        expect.objectContaining({
          method: 'post',
          body: JSON.stringify(transactions)
        })
      )
    })
    it('throws on a non-ok response', async () => {
      const transactions = ['a', 'b']
      fetch.mockReturnValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => JSON.stringify({ error: 'Description' }) })
      await expect(salesApi.createTransactions(transactions)).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 404.*"statusText": "Not Found"/s
      )
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
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.finaliseTransaction(transactionId, payload)).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        `http://0.0.0.0:4000/transactions/${transactionId}`,
        expect.objectContaining({
          method: 'patch',
          body: JSON.stringify(payload)
        })
      )
    })

    it('throws on a non-ok response', async () => {
      const transactionId = 'test_id'
      const payload = {
        payment: {
          amount: 30,
          timestamp: new Date().toISOString(),
          type: 'Gov Pay',
          method: 'Debit card'
        }
      }
      fetch.mockReturnValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => JSON.stringify({ error: 'Description' }) })
      await expect(salesApi.finaliseTransaction(transactionId, payload)).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 404.*"statusText": "Not Found"/s
      )
      expect(fetch).toHaveBeenCalledWith(
        `http://0.0.0.0:4000/transactions/${transactionId}`,
        expect.objectContaining({
          method: 'patch',
          body: JSON.stringify(payload)
        })
      )
    })
  })

  describe('getTransactionFile', () => {
    it('retrieves details of an existing transaction file', async () => {
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.getTransactionFile('test.xml')).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/transaction-files/test.xml',
        expect.objectContaining({
          method: 'get'
        })
      )
    })
    it('returns null if none found', async () => {
      fetch.mockReturnValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => JSON.stringify({ error: 'Description' }) })
      await expect(salesApi.getTransactionFile('test.xml')).resolves.toBeNull()
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/transaction-files/test.xml',
        expect.objectContaining({
          method: 'get'
        })
      )
    })
  })

  describe('upsertTransactionFile', () => {
    it('updates the details of a given transaction file', async () => {
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.upsertTransactionFile('test.xml')).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/transaction-files/test.xml',
        expect.objectContaining({
          method: 'put'
        })
      )
    })
    it('throws on a non-ok response', async () => {
      fetch.mockReturnValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => JSON.stringify({ error: 'Description' })
      })
      await expect(salesApi.upsertTransactionFile('test.xml', { some: 'data' })).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 422.*"statusText": "Unprocessable Entity"/s
      )
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/transaction-files/test.xml',
        expect.objectContaining({
          method: 'put'
        })
      )
    })
  })

  describe('getPaymentJournal', () => {
    it('retrieves details of an existing payment journal', async () => {
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.getPaymentJournal('test-id')).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/paymentJournals/test-id',
        expect.objectContaining({
          method: 'get'
        })
      )
    })
    it('returns null if none found', async () => {
      fetch.mockReturnValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => JSON.stringify({ error: 'Description' }) })
      await expect(salesApi.getPaymentJournal('test-id')).resolves.toBeNull()
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/paymentJournals/test-id',
        expect.objectContaining({
          method: 'get'
        })
      )
    })
  })

  describe('createPaymentJournal', () => {
    it('creates a new payment journal', async () => {
      const payload = { some: 'data' }
      const expectedResponse = { a: 'response' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.createPaymentJournal('test-id', payload)).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/paymentJournals/test-id',
        expect.objectContaining({
          method: 'put',
          body: JSON.stringify(payload)
        })
      )
    })
    it('throws on a non-ok response', async () => {
      const payload = { some: 'data' }
      fetch.mockReturnValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => JSON.stringify({ error: 'Description' })
      })
      await expect(salesApi.createPaymentJournal('test-id', payload)).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 422.*"statusText": "Unprocessable Entity"/s
      )
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/paymentJournals/test-id',
        expect.objectContaining({
          method: 'put',
          body: JSON.stringify(payload)
        })
      )
    })
  })

  describe('updatePaymentJournal', () => {
    it('updates the details of a given transaction file', async () => {
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.updatePaymentJournal('test-id')).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/paymentJournals/test-id',
        expect.objectContaining({
          method: 'patch'
        })
      )
    })
    it('throws on a non-ok response', async () => {
      fetch.mockReturnValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => JSON.stringify({ error: 'Description' })
      })
      await expect(salesApi.updatePaymentJournal('test-id', { some: 'data' })).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 422.*"statusText": "Unprocessable Entity"/s
      )
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/paymentJournals/test-id',
        expect.objectContaining({
          method: 'patch'
        })
      )
    })
  })

  describe('createStagingException', () => {
    it('creates a new staging exception', async () => {
      const payload = { some: 'data' }
      const expectedResponse = { a: 'response' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.createStagingException(payload)).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/stagingExceptions',
        expect.objectContaining({
          method: 'post',
          body: JSON.stringify(payload)
        })
      )
    })
    it('throws on a non-ok response', async () => {
      const payload = { some: 'data' }
      fetch.mockReturnValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => JSON.stringify({ error: 'Description' })
      })
      await expect(salesApi.createStagingException(payload)).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 422.*"statusText": "Unprocessable Entity"/s
      )
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/stagingExceptions',
        expect.objectContaining({
          method: 'post',
          body: JSON.stringify(payload)
        })
      )
    })
  })

  describe('getPoclValidationErrorsForProcessing', () => {
    it('creates a new staging exception', async () => {
      const expectedResponse = { a: 'response' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.getPoclValidationErrorsForProcessing()).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/poclValidationErrors',
        expect.objectContaining({
          method: 'get'
        })
      )
    })
    it('throws on a non-ok response', async () => {
      fetch.mockReturnValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => JSON.stringify({ error: 'Description' })
      })
      await expect(salesApi.getPoclValidationErrorsForProcessing()).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 422.*"statusText": "Unprocessable Entity"/s
      )
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/poclValidationErrors',
        expect.objectContaining({
          method: 'get'
        })
      )
    })
  })

  describe('updatePoclValidationError', () => {
    it('creates a new staging exception', async () => {
      const id = 'test-id'
      const payload = { some: 'data' }
      const expectedResponse = { a: 'response' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.updatePoclValidationError(id, payload)).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/poclValidationErrors/test-id',
        expect.objectContaining({
          method: 'patch',
          body: JSON.stringify(payload)
        })
      )
    })
    it('throws on a non-ok response', async () => {
      const id = 'test-id'
      const payload = { some: 'data' }
      fetch.mockReturnValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => JSON.stringify({ error: 'Description' })
      })
      await expect(salesApi.updatePoclValidationError(id, payload)).rejects.toThrow(
        /Unexpected response from the Sales API:.*"status": 422.*"statusText": "Unprocessable Entity"/s
      )
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/poclValidationErrors/test-id',
        expect.objectContaining({
          method: 'patch',
          body: JSON.stringify(payload)
        })
      )
    })
  })

  describe('getSystemUser', () => {
    it('retrieves details of a system user', async () => {
      const expectedResponse = { some: 'data' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.getSystemUser('test-id')).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/systemUsers/test-id',
        expect.objectContaining({
          method: 'get'
        })
      )
    })
    it('returns null if none found', async () => {
      fetch.mockReturnValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => JSON.stringify({ error: 'Description' }) })
      await expect(salesApi.getSystemUser('test-id')).resolves.toBeNull()
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/systemUsers/test-id',
        expect.objectContaining({
          method: 'get'
        })
      )
    })
  })

  describe('query endpoints', () => {
    describe.each(['permits', 'concessions', 'permitConcessions', 'transactionCurrencies', 'paymentJournals'])(
      'allows %s to be queried with different methods',
      endpoint => {
        it('retrieves all items using .getAll()', async () => {
          const expectedResponse = [{ id: 'test-1' }, { id: 'test-2' }]
          fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
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
          fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
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
          fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(apiResponse) })
          await expect(salesApi[endpoint].find({ set: '1' })).resolves.toEqual(expectedResponse)
          expect(fetch).toHaveBeenCalledWith(`http://0.0.0.0:4000/${endpoint}?set=1`, {
            method: 'get',
            headers: expect.any(Object),
            timeout: 20000
          })
        })

        it('throws if given a non-ok response code when calling .getAll()', async () => {
          fetch.mockReturnValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => JSON.stringify({ error: 'Description' })
          })
          await expect(salesApi[endpoint].getAll()).rejects.toThrow(
            /Unexpected response from the Sales API:.*"status": 404.*"statusText": "Not Found"/s
          )
          expect(fetch).toHaveBeenCalledWith(`http://0.0.0.0:4000/${endpoint}?`, {
            method: 'get',
            headers: expect.any(Object),
            timeout: 20000
          })
        })

        it('throws if given a non-ok response code when calling .find(criteria)', async () => {
          fetch.mockReturnValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => JSON.stringify({ error: 'Description' })
          })
          await expect(salesApi[endpoint].find({ set: '1' })).rejects.toThrow(
            /Unexpected response from the Sales API:.*"status": 404.*"statusText": "Not Found"/s
          )
          expect(fetch).toHaveBeenCalledWith(`http://0.0.0.0:4000/${endpoint}?set=1`, {
            method: 'get',
            headers: expect.any(Object),
            timeout: 20000
          })
        })

        it('returns undefined if no item could be found using .find(criteria)', async () => {
          fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify([]) })
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

  describe('country endpoint', () => {
    it('retrieves all items using .getAll()', async () => {
      const expectedResponse = [{ id: 'test-1' }, { id: 'test-2' }]
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.countries.getAll()).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith('http://0.0.0.0:4000/option-sets/defra_country?', {
        method: 'get',
        headers: expect.any(Object),
        timeout: 20000
      })
    })
  })

  describe('authentication', () => {
    it('retrieves all items using .getAll()', async () => {
      const expectedResponse = { foo: 'bar' }
      fetch.mockReturnValue({ ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(expectedResponse) })
      await expect(salesApi.authenticate('AAAAAA', '1980-03-02', 'BS9 4PT')).resolves.toEqual(expectedResponse)
      expect(fetch).toHaveBeenCalledWith(
        'http://0.0.0.0:4000/authenticate/renewal/AAAAAA?licenseeBirthDate=1980-03-02&licenseePostcode=BS9%204PT',
        {
          method: 'get',
          headers: expect.any(Object),
          timeout: 20000
        }
      )
    })
  })

  describe('isSystemError', () => {
    it.each([
      [500, true],
      [502, true],
      [404, false],
      [null, false],
      [undefined, false],
      [200, false]
    ])('when given a "%s" status code, returns %s', async (statusCode, expected) => {
      expect(salesApi.isSystemError(statusCode)).toEqual(expected)
    })
  })
})
