import { getBearerToken } from '../storm-padlock-service.js'
import { StormPadlockCache } from '../storm-padlock-cache.js'

jest.mock('../storm-padlock-cache.js', () => {
  return {
    StormPadlockCache: jest.fn().mockImplementation(() => {
      return {
        getCachedToken: jest.fn(async () => {}),
        setCachedToken: jest.fn(async () => {}),
        disconnect: jest.fn(async () => {})
      }
    })
  }
})

describe('storm-padlock-service', () => {
  describe('getBearerToken', () => {
    const mockFetchSuccessResponse = (accessToken = 'foo', expiresIn = 1000) => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: () => ({ accessToken, expiresIn }) })
    }

    const mockFetchErrorResponse = error => {
      globalThis.fetch = jest.fn().mockRejectedValueOnce(error)
    }

    const mockFetchFailureResponse = (status, statusText) => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status, statusText })
    }

    beforeEach(() => {
      jest.clearAllMocks()

      process.env.STORM_PADLOCK_API_TIMEOUT_MS = '10000'
      process.env.STORM_PADLOCK_API_TOKEN_URL = 'https://www.example.com/'
      process.env.STORM_PADLOCK_CLIENT_ID = 'client_id'
      process.env.STORM_PADLOCK_CLIENT_SECRET = 'client_secret'
    })

    it('sets up the cache', async () => {
      mockFetchSuccessResponse()

      await getBearerToken()

      expect(StormPadlockCache).toHaveBeenCalledTimes(1)
    })

    it('checks if the token is already cached', async () => {
      const getCachedTokenSpy = jest.fn(async () => {})
      StormPadlockCache.mockImplementationOnce(() => {
        return {
          getCachedToken: getCachedTokenSpy,
          setCachedToken: jest.fn(async () => {}),
          disconnect: jest.fn(async () => {})
        }
      })
      mockFetchSuccessResponse()

      await getBearerToken()

      expect(getCachedTokenSpy).toHaveBeenCalledTimes(1)
    })

    describe('when the token is already cached', () => {
      const mockCachedToken = (token = 'foo') => {
        StormPadlockCache.mockImplementationOnce(() => {
          return {
            getCachedToken: jest.fn(async () => token),
            setCachedToken: jest.fn(async () => {}),
            disconnect: jest.fn(async () => {})
          }
        })
      }

      it('returns the cached token', async () => {
        const expectedToken = Symbol('expectedToken')
        mockCachedToken(expectedToken)

        const token = await getBearerToken()

        expect(token).toBe(expectedToken)
      })

      it('does not call fetch', async () => {
        globalThis.fetch = jest.fn()
        mockCachedToken()

        await getBearerToken()

        expect(fetch).not.toHaveBeenCalled()
      })

      it('does not update the cache', async () => {
        const setCachedTokenSpy = jest.fn(async () => {})
        StormPadlockCache.mockImplementationOnce(() => {
          return {
            getCachedToken: jest.fn(async () => 'foo'),
            setCachedToken: setCachedTokenSpy,
            disconnect: jest.fn(async () => {})
          }
        })

        await getBearerToken()

        expect(setCachedTokenSpy).not.toHaveBeenCalled()
      })

      it('disconnects from the cache', async () => {
        const disconnectSpy = jest.fn(async () => {})
        StormPadlockCache.mockImplementationOnce(() => {
          return {
            getCachedToken: jest.fn(async () => 'foo'),
            setCachedToken: jest.fn(async () => {}),
            disconnect: disconnectSpy
          }
        })

        await getBearerToken()

        expect(disconnectSpy).toHaveBeenCalledTimes(1)
      })
    })

    describe('when the token is not currently cached', () => {
      it('sends expected fetch request', async () => {
        mockFetchSuccessResponse()
        const timeoutSpy = jest.spyOn(AbortSignal, 'timeout').mockImplementationOnce(() => {})

        await getBearerToken()

        expect(fetch).toHaveBeenCalledWith('https://www.example.com/', {
          method: 'post',
          headers: {
            accept: 'application/json',
            authorization: 'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=',
            'content-type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials',
          signal: expect(timeoutSpy).toHaveBeenCalledWith(10000)
        })
      })

      it.each(['foo', null, undefined])(
        'falls back to the default of 20000 if no valid STORM_PADLOCK_API_TIMEOUT_MS is provided',
        async invalidTimeout => {
          process.env.STORM_PADLOCK_API_TIMEOUT_MS = invalidTimeout
          mockFetchSuccessResponse()
          const timeoutSpy = jest.spyOn(AbortSignal, 'timeout').mockImplementationOnce(() => {})

          await getBearerToken()

          expect(timeoutSpy).toHaveBeenCalledWith(20000)
        }
      )

      it('updates the cache with the correct token value and token timeout', async () => {
        const setCachedTokenSpy = jest.fn(async () => {})
        StormPadlockCache.mockImplementationOnce(() => {
          return {
            getCachedToken: jest.fn(async () => {}),
            setCachedToken: setCachedTokenSpy,
            disconnect: jest.fn(async () => {})
          }
        })

        const expectedToken = Symbol('expectedToken')
        const expectedTimeout = Symbol('expectedTimeout')
        mockFetchSuccessResponse(expectedToken, expectedTimeout)

        await getBearerToken()

        expect(setCachedTokenSpy).toHaveBeenCalledWith(expectedToken, expectedTimeout)
      })

      it('returns the token', async () => {
        const expectedToken = Symbol('expectedToken')
        mockFetchSuccessResponse(expectedToken)

        const token = await getBearerToken()

        expect(token).toBe(expectedToken)
      })

      it('disconnects from the cache', async () => {
        const disconnectSpy = jest.fn(async () => {})
        StormPadlockCache.mockImplementationOnce(() => {
          return {
            getCachedToken: jest.fn(async () => {}),
            setCachedToken: jest.fn(async () => {}),
            disconnect: disconnectSpy
          }
        })
        mockFetchSuccessResponse()

        await getBearerToken()

        expect(disconnectSpy).toHaveBeenCalledTimes(1)
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

        it('does not update the cache', async () => {
          const setCachedTokenSpy = jest.fn(async () => {})
          StormPadlockCache.mockImplementationOnce(() => {
            return {
              getCachedToken: jest.fn(async () => {}),
              setCachedToken: setCachedTokenSpy,
              disconnect: jest.fn(async () => {})
            }
          })

          mockFetchErrorResponse(new Error('Bad!'))

          try {
            await getBearerToken()
          } catch {
            expect(setCachedTokenSpy).not.toHaveBeenCalled()
          }
        })

        it('disconnects from the cache', async () => {
          const disconnectSpy = jest.fn(async () => {})
          StormPadlockCache.mockImplementationOnce(() => {
            return {
              getCachedToken: jest.fn(async () => {}),
              setCachedToken: jest.fn(async () => {}),
              disconnect: disconnectSpy
            }
          })
          mockFetchErrorResponse(new Error('Bad!'))

          try {
            await getBearerToken()
          } catch {
            expect(disconnectSpy).toHaveBeenCalledTimes(1)
          }
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
})
