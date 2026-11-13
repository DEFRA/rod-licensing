import { getBearerToken } from '../storm-padlock-service.js'

describe('storm-padlock-service', () => {
  describe('getBearerToken', () => {
    const mockFetchSuccessResponse = (accessToken = 'foo') => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: () => ({ accessToken }) })
    }

    const mockFetchErrorResponse = error => {
      globalThis.fetch = jest.fn().mockRejectedValueOnce(error)
    }

    const mockFetchFailureResponse = (status, statusText) => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status, statusText })
    }

    beforeEach(() => {
      jest.clearAllMocks()

      process.env.STORM_PADLOCK_API_TIMEOUT_MS = 10000
      process.env.STORM_PADLOCK_API_TOKEN_URL = 'https://www.example.com/'
      process.env.STORM_PADLOCK_CLIENT_ID = 'client_id'
      process.env.STORM_PADLOCK_CLIENT_SECRET = 'client_secret'
    })

    it('sends expected fetch request', async () => {
      mockFetchSuccessResponse()

      await getBearerToken()

      expect(fetch).toHaveBeenCalledWith('https://www.example.com/', {
        method: 'post',
        headers: {
          accept: 'application/json',
          authorization: 'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=',
          'content-type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials',
        timeout: '10000'
      })
    })

    it('returns the token', async () => {
      const expectedToken = Symbol('expectedToken')
      mockFetchSuccessResponse(expectedToken)

      const token = await getBearerToken()

      expect(token).toBe(expectedToken)
    })

    describe('when fetch throws an error', () => {
      it('logs the correct error message', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const expectedError = new Error('Bad!')
        mockFetchErrorResponse(expectedError)

        try {
          await getBearerToken()
        } catch (error) {
          expect(consoleErrorSpy).toHaveBeenCalledWith('Error requesting Bearer token from Storm API', expectedError)
        }
      })

      it('throws the error', async () => {
        const expectedError = new Error('Bad!')
        mockFetchErrorResponse(expectedError)

        await expect(getBearerToken()).rejects.toThrow(expectedError)
      })
    })

    describe.each([
      [400, 'Bad Request'],
      [401, 'Unauthorized']
    ])('when fetch returns an unsuccessful %d response', (status, statusText) => {
      it('throws the error', async () => {
        mockFetchFailureResponse(status, statusText)

        await expect(getBearerToken()).rejects.toThrow('Failure retrieving Bearer token from Storm API', { status, statusText })
      })
    })
  })
})
