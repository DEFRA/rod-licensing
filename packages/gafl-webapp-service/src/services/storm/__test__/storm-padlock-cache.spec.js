// import { createCache } from 'cache-manager'

jest.mock('cache-manager', () => ({
  createCache: jest.fn(() => ({
    get: jest.fn(async () => {}),
    set: jest.fn(async (_key, value) => value),
    disconnect: jest.fn(async () => {})
  }))
}))
jest.mock('keyv', () => jest.fn(() => jest.fn()))
// jest.mock('@keyv/redis', () => jest.fn(() => jest.fn()))
jest.mock('@keyv/redis', () => {
  return jest.fn().mockImplementation(() => {})
})

describe('storm-padlock-cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    process.env.TODO_SORT_OUT_REDIS_URI = 'redis://user:pass@localhost:6379'
    process.env.REDIS_HOST = 'https://www.example.com/'
    process.env.REDIS_PORT = '1234'
  })

  // TODO: Refactor how cache instantiation is tested
  // es-lint does not like using 'new' just to test what else is called
  // so these three tests are commented out for reference for now

  // it('instantiates the cache', done => {
  //   jest.isolateModules(async () => {
  //     const { StormPadlockCache } = require('../storm-padlock-cache.js')

  //     new StormPadlockCache()

  //     expect(createCache).toHaveBeenCalledWith({
  //       stores: expect.any(Array)
  //     })
  //     done()
  //   })
  // })

  // it('calls Keyv with the correct values during instantiation', done => {
  //   jest.isolateModules(async () => {
  //     const { StormPadlockCache } = require('../storm-padlock-cache.js')
  //     const Keyv = require('keyv')

  //     new StormPadlockCache()

  //     expect(Keyv).toHaveBeenCalledWith({
  //       store: expect.any(Object)
  //     })
  //     done()
  //   })
  // })

  // it('calls KeyvRedis with the correct values during instantiation', done => {
  //   jest.isolateModules(async () => {
  //     const { StormPadlockCache } = require('../storm-padlock-cache.js')
  //     const KeyvRedis = require('@keyv/redis')

  //     new StormPadlockCache()

  //     expect(KeyvRedis).toHaveBeenCalledWith(process.env.TODO_SORT_OUT_REDIS_URI)
  //     done()
  //   })
  // })

  it('returns the cached token when getCachedToken() is called', done => {
    jest.isolateModules(async () => {
      const { StormPadlockCache } = require('../storm-padlock-cache.js')

      const cache = new StormPadlockCache()

      await cache.getCachedToken()

      expect(cache._cache.get).toHaveBeenCalledTimes(1)
      done()
    })
  })

  it('updates the cache with the correct values when setCachedToken() is called', done => {
    jest.isolateModules(async () => {
      const { StormPadlockCache } = require('../storm-padlock-cache.js')
      const expectedToken = Symbol('expectedToken')
      const expectedTimeout = Symbol('expectedTimeout')

      const cache = new StormPadlockCache()

      await cache.setCachedToken(expectedToken, expectedTimeout)

      expect(cache._cache.set).toHaveBeenCalledWith('storm_token', expectedToken, expectedTimeout)
      done()
    })
  })

  it('disconnects when disconnect() is called', done => {
    jest.isolateModules(async () => {
      const { StormPadlockCache } = require('../storm-padlock-cache.js')

      const cache = new StormPadlockCache()

      await cache.disconnect()

      expect(cache._cache.disconnect).toHaveBeenCalledTimes(1)
      done()
    })
  })
})
