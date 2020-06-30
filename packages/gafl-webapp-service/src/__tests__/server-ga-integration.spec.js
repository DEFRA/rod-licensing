import HapiGapi from 'hapi-gapi'
import Hapi from '@hapi/hapi'
import { SESSION_COOKIE_NAME_DEFAULT, UTM } from '../constants.js'
import sessionManager, { useSessionCookie } from '../session-cache/session-manager.js'

jest.mock('@hapi/hapi', () => ({
  server: jest.fn(() => ({
    app: { },
    cache: () => {},
    decorate: () => {},
    ext: () => {},
    info: { uri: 'http://test.test' },
    register: jest.fn(),
    route: () => {},
    start: () => Promise.resolve(),
    state: () => {},
    views: () => {}
  }))
}))

jest.mock('../constants', () => ({
  SESSION_COOKIE_NAME_DEFAULT: 'session_cookie_name_default',
  UTM: {
    CAMPAIGN: 'utmcampaign',
    MEDIUM: 'utmmedium'
  },
  CommonResults: {
    OK: 'okay'
  }
}))

jest.mock('../session-cache/session-manager.js', () => ({
  __esModule: true,
  default: () => {},
  useSessionCookie: jest.fn(() => true)
}))

describe('Server GA integration', () => {
  const OLD_ENV = process.env
  const { createServer, init } = require('../server.js')

  beforeEach(() => {
    process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
    process.env.ANALYTICS_EXGOV_PROPERTY = 'UA-987654321-0'
    jest.clearAllMocks()
    createServer()
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('registers HapiGapi plugin', async () => {
    await init()
    expect(getHapiGapiPlugin()).not.toBeUndefined()
  })

  it('passes sessionIdProducer that gets session id from process.env', async () => {
    const cookieName = 'Bourbon-1272'
    process.env.SESSION_COOKIE_NAME = 'session_cookie_name'
    const request = generateRequestMock(undefined, process.env.SESSION_COOKIE_NAME, cookieName)
    console.log('request.state', request.state)
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.sessionIdProducer(request)).toBe(cookieName)
  })

  it('if session cookie hasn\'t been set, use default value for sessionIdProducer', async () => {
    const cookieName = 'Garibaldi-1807'
    delete process.env.SESSION_COOKIE_NAME
    const request = generateRequestMock(undefined, SESSION_COOKIE_NAME_DEFAULT, cookieName)
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.sessionIdProducer(request)).toBe(cookieName)
  })

  it('sessionIdProducer returns null if we\'re not using a session cookie', async () => {
    useSessionCookie.mockReturnValueOnce(false)
    const request = generateRequestMock()
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.sessionIdProducer(request)).toBe(null)
  })

  it('returns an empty object if attribution is empty', async () => {
    const request = generateRequestMock()
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(await hapiGapiPlugin.options.attributionProducer(request)).toEqual({})
  })

  it.each([
    { [UTM.CAMPAIGN]: 'campaign-123b', [UTM.MEDIUM]: 'footer', [UTM.CONTENT]: 'foo-bar' },
    { [UTM.CAMPAIGN]: 'campaign-99xx', [UTM.SOURCE]: 'bbq', [UTM.TERM]: 'hilary' },
    { [UTM.MEDIUM]: 'banner', [UTM.CONTENT]: 'blah-di-blah' }
  ])('sets correct values in attribution according to session attribution', async (attribution) => {
    const request = generateRequestMock({ attribution })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(await hapiGapiPlugin.options.attributionProducer(request)).toEqual(mapAttributionValues(attribution))
  })

  it('gets campaign utm_medium attribute from session', async () => {
    const medium = 'banner'
    const request = generateRequestMock({ attribution: { [UTM.CAMPAIGN]: ' ', [UTM.MEDIUM]: medium } })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect((await hapiGapiPlugin.options.attributionProducer(request)).medium).toBe(medium)
  })

  it('gets campaign utm_medium attribute from querystring', async () => {
    const campaign = 'campaign-99'
    const request = generateRequestMock({ attribution: { [UTM.CAMPAIGN]: campaign, [UTM.MEDIUM]: ' ' } })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect((await hapiGapiPlugin.options.attributionProducer(request)).campaign).toBe(campaign)
  })

  it('attribution producer returns empty object if useSessionCookie flag function returns false', async () => {
    useSessionCookie.mockReturnValueOnce(false)
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect((await hapiGapiPlugin.options.attributionProducer({}))).toEqual({})
  })

  it.each([
    'ANALYTICS_PRIMARY_PROPERTY',
    'ANALYTICS_EXGOV_PROPERTY'
  ])('doesn\'t initialise plugins with HapiGapi if %s flag isn\'t present', async (flag) => {
    delete process.env[flag]
    await init()
    expect(getHapiGapiPlugin()).toBeUndefined()
  })

  const mapAttributionValues = attribution => {
    const mapped = {}
    if (attribution[UTM.CAMPAIGN]) mapped.campaign = attribution[UTM.CAMPAIGN]
    if (attribution[UTM.CONTENT]) mapped.content = attribution[UTM.CONTENT]
    if (attribution[UTM.MEDIUM]) mapped.medium = attribution[UTM.MEDIUM]
    if (attribution[UTM.SOURCE]) mapped.source = attribution[UTM.SOURCE]
    if (attribution[UTM.TERM]) mapped.term = attribution[UTM.TERM]
    return mapped
  }

  const getHapiGapiPlugin = () => {
    const mockServer = Hapi.server.mock.results[0].value
    const [plugins] = mockServer.register.mock.calls[0]
    return plugins.find(p => p.plugin === HapiGapi)
  }

  const generateRequestMock = (status = {}, sessionCookieName = 'sessionCookieName', sessionId = 'sessionId') => ({
    state: {
      [sessionCookieName]: { id: sessionId }
    },
    cache: jest.fn(() => ({
      helpers: {
        status: {
          get: jest.fn(() => status),
          set: jest.fn()
        }
      }
    }))
  })
})
