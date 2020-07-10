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
  const { createServer, init } = require('../server.js')

  beforeEach(() => {
    process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
    process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
    jest.clearAllMocks()
    createServer()
  })

  afterEach(() => {
    delete process.env.ANALYTICS_PRIMARY_PROPERTY
    delete process.env.ANALYTICS_XGOV_PROPERTY
  })

  it('registers HapiGapi plugin', async () => {
    await init()
    expect(getHapiGapiPlugin()).not.toBeUndefined()
  })

  it('gets session id from cache', async () => {
    const cookieName = 'Bourbon-1272'
    const request = generateRequestMock(undefined, { getId: () => cookieName })
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

  it('gets UTM medium attribute from session', async () => {
    const medium = 'banner'
    const request = generateRequestMock({ attribution: { [UTM.CAMPAIGN]: ' ', [UTM.MEDIUM]: medium } })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect((await hapiGapiPlugin.options.attributionProducer(request)).medium).toBe(medium)
  })

  it('gets UTM campaign attribute from session', async () => {
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

  it('initialises property settings for ANALYTICS_PRIMARY_PROPERTY', async () => {
    await init()
    const [analyticsPrimaryProperty] = getHapiGapiPlugin().options.propertySettings
    expect(analyticsPrimaryProperty).toEqual(
      expect.objectContaining({
        id: process.env.ANALYTICS_PRIMARY_PROPERTY,
        hitTypes: ['pageview', 'event', 'ecommerce']
      })
    )
  })

  it('initialises property settings for ANALYTICS_XGOV_PROPERTY', async () => {
    await init()
    const analyticsXGovProperty = getHapiGapiPlugin().options.propertySettings[1]
    expect(analyticsXGovProperty).toEqual(
      expect.objectContaining({
        id: process.env.ANALYTICS_XGOV_PROPERTY,
        hitTypes: ['pageview']
      })
    )
  })

  it('omits ANALYTICS_PRIMARY_PROPERTY settings if it\'s not set', async () => {
    delete process.env.ANALYTICS_PRIMARY_PROPERTY
    await init()
    const [property] = getHapiGapiPlugin().options.propertySettings
    expect(getHapiGapiPlugin().options.propertySettings.length).toBe(1)
    expect(property).toEqual(
      expect.objectContaining({
        id: process.env.ANALYTICS_XGOV_PROPERTY,
        hitTypes: ['pageview']
      })
    )
  })

  it('omits ANALYTICS_XGOV_PROPERTY settings if it\'s not set', async () => {
    delete process.env.ANALYTICS_XGOV_PROPERTY
    await init()
    const [property] = getHapiGapiPlugin().options.propertySettings
    expect(getHapiGapiPlugin().options.propertySettings.length).toBe(1)
    expect(property).toEqual(
      expect.objectContaining({
        id: process.env.ANALYTICS_PRIMARY_PROPERTY,
        hitTypes: ['pageview', 'event', 'ecommerce']
      })
    )
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

  const generateRequestMock = (status = {}, cache = {}) => ({
    cache: jest.fn(() => ({
      getId: () => {},
      helpers: {
        status: {
          get: jest.fn(() => status),
          set: jest.fn()
        }
      },
      ...cache
    }))
  })
})
