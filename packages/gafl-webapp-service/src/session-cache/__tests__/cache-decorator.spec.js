import { CacheError, contextCache } from '../cache-manager.js'
import { cacheDecorator } from '../cache-decorator.js'

jest.mock('../cache-manager.js')

describe('Cache decorator', () => {
  it('gets id from state', () => {
    const sessionId = 'abc123'
    const sessionCookieName = 'custardCream'
    const context = getCacheDecoratorContext({
      state: { [sessionCookieName]: { id: sessionId } }
    })

    expect(generateCacheDecorator(context).getId()).toBe(sessionId)
  })

  it.each([
    { context: { state: { sid: null } }, sessionCookieName: 'sid', description: 'session cookie is null' },
    { context: { state: { scn: undefined } }, sessionCookieName: 'scn', description: 'session cookie is undefined' },
    { context: { state: {} }, sessionCookieName: 'garibaldi', description: "session cookie doesn't exist" },
    { context: { state: null }, sessionCookieName: 'chocolate-chip', description: 'state is null' },
    { context: { state: undefined }, sessionCookieName: 'hobnob', description: 'state is undefined' }
  ])('getting id throws cache error if $description', ({ context, sessionCookieName }) => {
    const cacheDecorator = generateCacheDecorator(getCacheDecoratorContext(context), sessionCookieName)
    const error = (() => {
      try {
        cacheDecorator.getId()
      } catch (e) {
        return e
      }
    })()

    expect(error instanceof CacheError).toBeTruthy()
  })

  describe('existingPermissions', () => {
    beforeEach(jest.clearAllMocks)

    const getSampleCache = (cookieName = 'crunch-cream') => {
      const sampleCache = {
        server: { app: {} },
        state: { [cookieName]: { id: 'abc-123' } }
      }
      sampleCache.decorator = cacheDecorator(cookieName)
      Object.assign(sampleCache, sampleCache.decorator())
      return sampleCache
    }

    it('uses contextCache to get existingPermissions', async () => {
      const sampleCache = getSampleCache()
      const mockCacheStore = { get: jest.fn() }
      contextCache.mockReturnValueOnce(mockCacheStore)

      await sampleCache.helpers.existingPermissions.get()

      expect(mockCacheStore.get).toHaveBeenCalled()
    })

    it('uses value returned by cache store to fulfill request', async () => {
      const cacheValue = Symbol('cacheValue')
      const sampleCache = getSampleCache()
      const mockCacheStore = { get: jest.fn(() => cacheValue) }
      contextCache.mockReturnValueOnce(mockCacheStore)

      const fulfilledValue = await sampleCache.helpers.existingPermissions.get()

      expect(fulfilledValue).toBe(cacheValue)
    })

    it.each(['get', 'set'])('passes server cache, id and correct key to contextCache before calling %s', async method => {
      const cookieName = 'fig-roll'
      const sampleCache = getSampleCache(cookieName)
      const id = Symbol('id')
      const appCache = Symbol('appCache')
      sampleCache.server.app.cache = appCache
      sampleCache.state[cookieName].id = id
      const mockCacheStore = { [method]: jest.fn() }
      contextCache.mockReturnValueOnce(mockCacheStore)

      await sampleCache.helpers.existingPermissions[method]()

      expect(contextCache).toHaveBeenCalledWith(appCache, id, 'existingPermissions')
    })

    it('uses contextCache to set cache', async () => {
      const cacheValue = Symbol('cacheValue')
      const sampleCache = getSampleCache()
      const mockCacheStore = { set: jest.fn() }
      contextCache.mockReturnValueOnce(mockCacheStore)

      await sampleCache.helpers.existingPermissions.set(cacheValue)

      expect(mockCacheStore.set).toHaveBeenCalledWith(cacheValue)
    })
  })
})

const getCacheDecoratorContext = context => ({
  state: {
    sid: {
      id: 'session-id'
    }
  },
  server: {
    app: {}
  },
  ...context
})

const generateCacheDecorator = (context, sessionCookieName = Object.keys(context.state)[0]) => {
  return cacheDecorator(sessionCookieName).call(context)
}
