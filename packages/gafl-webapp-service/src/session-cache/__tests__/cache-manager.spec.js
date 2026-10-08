import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../__mocks__/test-utils-system.js'
import { CONTROLLER, LICENCE_TYPE } from '../../uri.js'
import { contexts, base, contextCache } from '../cache-manager.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

mockSalesApi()

const getMockAppCache = () => ({
  set: jest.fn(),
  get: jest.fn(),
  drop: jest.fn()
})

describe('The session cache removal', () => {
  it('will result in a redirect to the controller', async () => {
    await injectWithCookies('GET', '/buy/clear-cache')
    const response = await injectWithCookies('GET', LICENCE_TYPE.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })

  /*
   * The reason it must is that the error handler built into hapi acts before the request pre-handler and so
   * will throw an exception on the cache read failure because the pre-handler has not had time to restore the
   * session cache. This is caught and the controller is invoked with a redirect
   */
  it('will redirect to the start of the journey an invalid post response', async () => {
    await injectWithCookies('GET', '/buy/clear-cache')
    const response = await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': 'hunting-licence' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })
})

describe('contexts', () => {
  it('has expected contexts', () => {
    expect(contexts).toMatchSnapshot()
  })
})

describe('base', () => {
  describe.each(['init', 'set'])('has %s function', fnName => {
    it.each(['abc-123', 'def-456', 'db396bac-38df-48ea-9e1f-c4567274ef44'])('that sets app cache with id %s', sampleId => {
      const sampleAppCache = getMockAppCache()
      const sampleBase = base(sampleAppCache, sampleId)
      const objParam = {}
      sampleBase[fnName](objParam)
      expect(sampleAppCache.set).toHaveBeenCalledWith(sampleId, objParam)
    })
  })

  it.each(['abc-123', 'def-456', 'db396bac-38df-48ae-9e1f-c4567274ef44'])('has get function that gets app cache with id %s', sampleId => {
    const sampleAppCache = getMockAppCache()
    const sampleBase = base(sampleAppCache, sampleId)
    sampleBase.get()
    expect(sampleAppCache.get).toHaveBeenCalledWith(sampleId)
  })

  it.each(['abc-123', 'def-456', 'db396bac-38df-48ea-9ef1-c4567274ef44'])(
    'has clear function that drops app cache with id %s',
    sampleId => {
      const sampleAppCache = getMockAppCache()
      const sampleBase = base(sampleAppCache, sampleId)
      sampleBase.clear()
      expect(sampleAppCache.drop).toHaveBeenCalledWith(sampleId)
    }
  )
})

describe('contextCache', () => {
  it('get method returns context value if defined', async () => {
    const sampleAppCache = getMockAppCache()
    const sampleValue = Symbol('identifier')
    sampleAppCache.get.mockResolvedValueOnce({ 'page-context': sampleValue })

    const contextValue = await contextCache(sampleAppCache, 'abc-123', 'page').get()

    expect(contextValue).toBe(sampleValue)
  })

  it('get method returns null if context value is not defined', async () => {
    const sampleAppCache = getMockAppCache()

    const contextValue = await contextCache(sampleAppCache, 'abc-123', 'page').get()

    expect(contextValue).toBeNull()
  })

  it('set method is additive to existing context', async () => {
    const sampleAppCache = getMockAppCache()
    const originalCacheValue = { 'transaction-context': { a: 1, b: 'f57a955d-40d4-41e3-b1b1-fb7356e7c13b' } }
    const additionalCacheValue = { c: 'cceab89a-d310-45fc-8d69-2003ded3c736' }
    const expectedValue = { 'transaction-context': { ...originalCacheValue['transaction-context'], ...additionalCacheValue } }
    sampleAppCache.get.mockResolvedValueOnce(originalCacheValue)

    await contextCache(sampleAppCache, 'abc-123', 'transaction').set(additionalCacheValue)

    expect(sampleAppCache.set).toHaveBeenCalledWith(expect.any(String), expect.objectContaining(expectedValue))
  })
})
