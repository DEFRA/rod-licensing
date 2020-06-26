import HapiGapi from 'hapi-gapi'
import Hapi from '@hapi/hapi'
import { UTM } from '../constants.js'
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
  UTM: {
    CAMPAIGN: 'utmcampaign',
    MEDIUM: 'utmmedium'
  },
  CommonResults: {
    OK: 'okay'
  }
}))

jest.mock('../session-cache/session-manager.js', () => ({
  __esModule: true, // this property makes it work
  default: () => {},
  useSessionCookie: jest.fn(() => true)
}))
console.log('sessionManger fdsjkladsfjkladsf', sessionManager)

describe('Server GA integration', () => {
  const OLD_ENV = process.env
  const { createServer, init } = require('../server.js')

  beforeEach(() => {
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
    process.env.SESSION_COOKIE_NAME = cookieName
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.sessionIdProducer()).toBe(cookieName)
  })

  it('if session cookie hasn\'t been set, use default value for sessionIdProducer', async () => {
    const cookieName = 'Garibaldi-1807'
    delete process.env.SESSION_COOKIE_NAME
    process.env.SESSION_COOKIE_NAME_DEFAULT = cookieName
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.sessionIdProducer()).toBe(cookieName)
  })

  it.each([
    [undefined, undefined],
    ['campaign-22', undefined],
    [undefined, 'banner']
  ])('doesn\'t return a value if both utm_medium and utm_campaign aren\'t both set', async (campaign, medium) => {
    const request = generateRequestMock({ [UTM.CAMPAIGN]: campaign, [UTM.MEDIUM]: medium })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(await hapiGapiPlugin.options.attributionProducer(request)).toBe(null)
  })

  it('gets campaign utm_medium attribute from session', async () => {
    const medium = 'banner'
    const request = generateRequestMock({ [UTM.CAMPAIGN]: ' ', [UTM.MEDIUM]: medium })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect((await hapiGapiPlugin.options.attributionProducer(request)).medium).toBe(medium)
  })

  it('gets campaign utm_medium attribute from querystring', async () => {
    const campaign = 'campaign-99'
    const request = generateRequestMock({ [UTM.CAMPAIGN]: campaign, [UTM.MEDIUM]: ' ' })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect((await hapiGapiPlugin.options.attributionProducer(request)).campaign).toBe(campaign)
  })

  it('omits attribution values if useSessionCookie flag function returns false', async () => {
    useSessionCookie.mockReturnValueOnce(false)
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect((await hapiGapiPlugin.options.attributionProducer({}))).toBeUndefined()
  })

  const getHapiGapiPlugin = () => {
    const mockServer = Hapi.server.mock.results[0].value
    const [plugins] = mockServer.register.mock.calls[0]
    return plugins.find(p => p.plugin === HapiGapi)
  }

  const generateRequestMock = (status = {}) => ({
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
