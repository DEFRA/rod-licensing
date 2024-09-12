import { createServer, init, server, layoutContextAmalgamation } from '../server.js'
import CatboxMemory from '@hapi/catbox-memory'
import uris from '../uri.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'

jest.mock('../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn(),
  addEmptyFragmentToUri: jest.fn()
}))
jest.mock('@defra-fish/connectors-lib')
jest.mock('../uri.js', () => ({
  ...jest.requireActual('../uri.js'),
  ACCESSIBILITY_STATEMENT: { uri: '/ACCESSIBILITY_STATEMENT' },
  COOKIES: { uri: '/COOKIES' },
  PRIVACY_POLICY: { uri: '/PRIVACY_POLICY' },
  REFUND_POLICY: { uri: '/REFUND_POLICY' },
  NEW_TRANSACTION: { uri: '/NEW_TRANSACTION' },
  NEW_PRICES: { uri: '/NEW_PRICES' },
  RECURRING_TERMS_CONDITIONS: { uri: '/RECURRING_TERMS_CONDITIONS' }
}))

export const catboxOptions = {
  port: 1234,
  cache: [
    {
      provider: {
        constructor: CatboxMemory
      }
    }
  ]
}

afterEach(() => {
  server.stop()
})

describe('The server', () => {
  it('starts', async () => {
    createServer(catboxOptions)
    expect(server.info.port).toBe(1234)
    server.stop()

    await init()
    expect(server.info.port).toBe(1234)
  })

  it('decorates the toolkit with redirectWithLanguageCode', async () => {
    createServer(catboxOptions)

    const serverDecorateSpy = jest.spyOn(server, 'decorate').mockImplementation(jest.fn())

    await init()
    expect(serverDecorateSpy).toHaveBeenCalledWith('toolkit', 'redirectWithLanguageCode', expect.any(Function))
  })

  it.each([[uris.NEW_PRICES.uri], [uris.RECURRING_TERMS_CONDITIONS.uri]])(
    'addLanguageCodeToUri is called with request but not %s',
    async uri => {
      createServer(catboxOptions)
      const serverDecorateSpy = jest.spyOn(server, 'decorate').mockImplementation(() => {})

      await init()
      const redirect = serverDecorateSpy.mock.calls[1][2]
      const mockRequest = { url: { pathname: '/buy' } }
      const mockRedirect = () => {}
      await redirect.call({ request: mockRequest, redirect: mockRedirect })

      expect(addLanguageCodeToUri).not.toHaveBeenCalledWith(expect.any(Object), uri)
    }
  )

  it.each([[uris.NEW_PRICES.uri], [uris.RECURRING_TERMS_CONDITIONS.uri]])(
    'addLanguageCodeToUri is called with request and %s',
    async uri => {
      createServer(catboxOptions)
      const serverDecorateSpy = jest.spyOn(server, 'decorate').mockImplementation(() => {})

      await init()
      const redirect = serverDecorateSpy.mock.calls[1][2]
      const mockRequest = { url: { pathname: uri } }
      const mockRedirect = () => {}
      await redirect.call({ request: mockRequest, redirect: mockRedirect })

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, uri)
    }
  )

  it('configures session handling in redis by default', async () => {
    process.env.REDIS_HOST = '0.0.0.0'
    process.env.REDIS_PORT = '12345'
    process.env.REDIS_PASSWORD = 'test123'
    createServer({ port: 1234 })
    expect(server.settings.cache).toEqual(
      expect.arrayContaining([
        {
          provider: {
            constructor: expect.any(Function),
            options: { db: 0, host: '0.0.0.0', partition: 'web-app', password: 'test123', port: '12345', tls: {} }
          }
        }
      ])
    )
  })

  it.each([
    ['SIGINT', 130],
    ['SIGTERM', 137]
  ])('calls the hapi shutdown hook on a %s signal', (signal, code, done) => {
    jest.isolateModules(async () => {
      const { createServer, init, shutdownBehavior, getServer } = require('../server.js')
      try {
        createServer((({ port, ...l }) => l)(catboxOptions))
        await init()
        shutdownBehavior()
        const server = getServer()
        const serverStopSpy = jest.spyOn(server, 'stop').mockImplementation(jest.fn())
        const processStopSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
        process.exit = processStopSpy
        process.emit(signal)
        setImmediate(async () => {
          expect(serverStopSpy).toHaveBeenCalled()
          expect(processStopSpy).toHaveBeenCalledWith(code)
          jest.restoreAllMocks()
          await server.stop()
          done()
        })
      } catch (e) {
        done(e)
      }
    })
  })

  describe('layoutContextAmalgamation', () => {
    it('should add query parameters to the response', () => {
      const request = getSampleRequest()
      layoutContextAmalgamation(request, {})
      expect(request.response.source.context._uri.queryParams).toStrictEqual({ lang: 'cy' })
    })

    it.each([
      ['true', true],
      ['TRUE', true],
      ['false', false],
      ['FALSE', false]
    ])(
      'if SHOW_WELSH_CONTENT is %s, it should set SHOW_WELSH_CONTENT to %s in the response',
      (inputShowWelshContent, outputShowWelshContent) => {
        process.env.SHOW_WELSH_CONTENT = inputShowWelshContent
        const request = getSampleRequest()
        layoutContextAmalgamation(request, {})
        expect(request.response.source.context.SHOW_WELSH_CONTENT).toBe(outputShowWelshContent)
      }
    )

    it.each([
      ['cookies', 'cookies.url', 'COOKIES'],
      ['refunds', 'refunds.url', 'REFUND_POLICY'],
      ['accessibility', 'access.ibility.uri', 'ACCESSIBILITY_STATEMENT'],
      ['privacy', 'privacy.uri', 'PRIVACY_POLICY'],
      ['clear', 'new-transaction.url', 'NEW_TRANSACTION'],
      ['newPrices', 'new-prices.url', 'NEW_PRICES']
    ])('should append Welsh language code to _uri elements if the current page contains it', (element, uri, uriConst) => {
      const request = getSampleRequest({
        url: {
          search: '?lang=cy'
        }
      })
      uris[uriConst] = { uri }
      const regexMatch = new RegExp(`^${uri}\\?lang=cy$`)
      layoutContextAmalgamation(request, {})
      expect(request.response.source.context._uri[element]).toEqual(expect.stringMatching(regexMatch))
    })

    it.each([
      ['cookies', 'biscuits.url', 'COOKIES'],
      ['refunds', 'i-want-my-money-back.url', 'REFUND_POLICY'],
      ['accessibility', 'easy-to-use.uri', 'ACCESSIBILITY_STATEMENT'],
      ['privacy', 'private.uri', 'PRIVACY_POLICY'],
      ['clear', 'clear.url', 'NEW_TRANSACTION'],
      ['newPrices', 'new-prices.url', 'NEW_PRICES']
    ])("should omit Welsh language code from _uri elements if the current page doesn't contain it", (element, uri, uriConst) => {
      const request = getSampleRequest({
        url: {
          search: ''
        }
      })
      uris[uriConst] = { uri }
      const regexMatch = new RegExp(`^${uri}$`)
      layoutContextAmalgamation(request, {})
      expect(request.response.source.context._uri[element]).toEqual(expect.stringMatching(regexMatch))
    })

    describe('logGtmConfig', () => {
      it('should log the gtmContainerId value if it is set', async () => {
        const expectedId = 'GTM-ABC1234'
        process.env.GTM_CONTAINER_ID = expectedId
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
        createServer(catboxOptions)
        await init()
        expect(consoleLogSpy).toHaveBeenCalledWith(`gtmContainerId is set to ${expectedId}`)
        await server.stop()
        delete process.env.GTM_CONTAINER_ID
      })

      it('should log that gtmContainerId is not set if it is not set', async () => {
        delete process.env.GTM_CONTAINER_ID
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
        createServer(catboxOptions)
        await init()
        expect(consoleLogSpy).toHaveBeenCalledWith('gtmContainerId is not set')
      })
    })

    const getSampleRequest = (overrides = {}) => ({
      auth: {},
      method: 'get',
      response: {
        variety: 'view',
        source: {
          context: {}
        }
      },
      query: { lang: 'cy' },
      url: {
        search: ''
      },
      ...overrides
    })
  })
})
