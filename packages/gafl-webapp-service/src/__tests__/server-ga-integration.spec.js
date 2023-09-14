import HapiGapi from '@defra/hapi-gapi'
import Hapi from '@hapi/hapi'
import { useSessionCookie } from '../session-cache/session-manager.js'

jest.mock('@hapi/hapi', () => ({
  server: jest.fn(() => ({
    app: {},
    listener: {},
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
  CommonResults: {
    OK: 'okay'
  },
  ShowDigitalLicencePages: {
    YES: 'show-digital-licence-yes'
  },
  MultibuyForYou: {
    YES: 'yes'
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
    process.env.ANALYTICS_PRIMARY_PROPERTY = 'G-XXXXXXX'
    process.env.ANALYTICS_PROPERTY_API = 'XXXXXXX-YYYYYYY-ZZZZZZZ'
    jest.clearAllMocks()
    createServer()
  })

  afterEach(() => {
    delete process.env.ANALYTICS_PRIMARY_PROPERTY
  })

  it('registers HapiGapi plugin', async () => {
    await init()
    expect(getHapiGapiPlugin()).not.toBeUndefined()
  })

  it('gets session id from cache', async () => {
    const cookieName = 'Bourbon-1272'
    const request = generateRequestMock({ gaClientId: undefined }, { getId: () => cookieName })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    await expect(hapiGapiPlugin.options.sessionIdProducer(request)).resolves.toEqual(cookieName)
  })

  it('uses the gaClientId in preference to the session id if it is set', async () => {
    const cookieName = 'Bourbon-1272'
    const gaClientId = 'Single-Malt'
    const request = generateRequestMock({ gaClientId: gaClientId }, { getId: () => cookieName })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    await expect(hapiGapiPlugin.options.sessionIdProducer(request)).resolves.toEqual(gaClientId)
  })

  it("sessionIdProducer returns null if we're not using a session cookie", async () => {
    useSessionCookie.mockReturnValueOnce(false)
    const request = generateRequestMock()
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    await expect(hapiGapiPlugin.options.sessionIdProducer(request)).resolves.toEqual(null)
  })

  it('initialises property settings for ANALYTICS_PRIMARY_PROPERTY', async () => {
    await init()
    const analyticsPrimaryProperty = getHapiGapiPlugin().options.propertySettings[0]
    expect(analyticsPrimaryProperty).toEqual(
      expect.objectContaining({
        id: process.env.ANALYTICS_PRIMARY_PROPERTY,
        hitTypes: ['page_view']
      })
    )
  })

  it("does not add property if ANALYTICS_PRIMARY_PROPERTY settings if it's not set", async () => {
    delete process.env.ANALYTICS_PRIMARY_PROPERTY
    await init()
    expect(getHapiGapiPlugin().options.propertySettings.length).toBe(0)
  })

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
