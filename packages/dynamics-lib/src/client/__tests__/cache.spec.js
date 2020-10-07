const mockCacheManagerClientQuit = jest.fn()
jest.mock('cache-manager', () => {
  const mockCache = {}
  const mockCacheGet = jest.fn(async (key, value) => mockCache[key])
  const mockCacheSet = jest.fn(async (key, value, options) => {
    mockCache[key] = value
  })

  return {
    caching: () => ({
      get: mockCacheGet,
      set: mockCacheSet,
      store: {
        name: 'redis',
        getClient: () => ({
          quit: mockCacheManagerClientQuit,
          on: () => {}
        })
      }
    })
  }
})

describe('cache', () => {
  beforeEach(jest.clearAllMocks)

  it('uses redis on the configured host and port', async () => {
    process.env.REDIS_HOST = 'localhost'
    process.env.REDIS_PORT = 123
    const options = require('../cache.js').config()
    expect(options).toMatchObject({
      store: expect.objectContaining({}),
      host: 'localhost',
      port: '123',
      ttl: 60 * 60 * 12
    })
  })

  it('configures tls and uses a password if one is supplied', async () => {
    process.env.REDIS_HOST = 'localhost'
    process.env.REDIS_PASSWORD = 'opensesame'
    delete process.env.REDIS_PORT
    const options = require('../cache.js').config()
    expect(options).toMatchObject({
      store: expect.objectContaining({}),
      host: 'localhost',
      port: 6379,
      ttl: 60 * 60 * 12,
      password: 'opensesame',
      tls: {}
    })
  })

  it('uses the default redis port if one is not specified', async () => {
    process.env.REDIS_HOST = 'localhost'
    delete process.env.REDIS_PORT
    const options = require('../cache.js').config()
    expect(options).toMatchObject({
      store: expect.objectContaining({}),
      host: 'localhost',
      port: 6379,
      ttl: 60 * 60 * 12
    })
  })

  it('uses an in-memory store if no redis configuration is provided', async () => {
    delete process.env.REDIS_HOST
    delete process.env.REDIS_PORT
    const options = require('../cache.js').config()
    expect(options).toMatchObject({
      store: 'memory',
      ttl: 60 * 60 * 12
    })
  })

  it('does not use the cache when calling .execute()', async () => {
    const { CacheableOperation, default: cache } = require('../cache.js')

    const testFetchOp = jest.fn(async () => 'fetchOpResult')
    const testResultProcessor = jest.fn(result => result)
    const test = new CacheableOperation(Math.random(), testFetchOp, testResultProcessor)

    await expect(test.execute()).resolves.toEqual('fetchOpResult')
    await expect(test.execute()).resolves.toEqual('fetchOpResult')
    expect(testFetchOp).toHaveBeenCalledTimes(2)
    expect(cache.get).not.toHaveBeenCalled()
    expect(cache.set).not.toHaveBeenCalled()
  })

  it('caches the first time .cached() is called', async () => {
    const { CacheableOperation, default: cache } = require('../cache.js')

    const testFetchOp = jest.fn(async () => 'fetchOpResult')
    const testResultProcessor = jest.fn(result => result)
    const test = new CacheableOperation(Math.random(), testFetchOp, testResultProcessor)

    await expect(test.cached()).resolves.toEqual('fetchOpResult')
    await expect(test.cached()).resolves.toEqual('fetchOpResult')
    expect(testFetchOp).toHaveBeenCalledTimes(1)
    expect(cache.get).toHaveBeenCalledTimes(2)
    expect(cache.set).toHaveBeenCalledTimes(1)
  })

  it('refuses to cache values if isCacheableValue returns false', async () => {
    const { CacheableOperation, default: cache } = require('../cache.js')

    const testFetchOp = jest.fn(async () => 'fetchOpResult')
    const testResultProcessor = jest.fn(result => result)
    const testIsCacheableValue = jest.fn(() => false)
    const test = new CacheableOperation(Math.random(), testFetchOp, testResultProcessor, testIsCacheableValue)

    await expect(test.cached()).resolves.toEqual('fetchOpResult')
    await expect(test.cached()).resolves.toEqual('fetchOpResult')
    expect(testFetchOp).toHaveBeenCalledTimes(2)
    expect(cache.get).toHaveBeenCalledTimes(2)
    expect(cache.set).not.toHaveBeenCalled()
  })

  it('exposes a method to allow the cache to be terminated', async () => {
    const { terminateCacheManager } = require('../cache.js')
    await expect(terminateCacheManager()).resolves.toBeUndefined()
    expect(mockCacheManagerClientQuit).toHaveBeenCalled()
  })
})
