import HapiGapi from 'hapi-gapi'
import Hapi from '@hapi/hapi'
import { createServer, init } from '../server.js'
import { UTM } from '../constants'

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
  }
}))

describe('Server GA integration', () => {
  const OLD_ENV = process.env

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

  it('gets campaign utm_medium attribute from session', async () => {
    const medium = 'banner'
    const request = generateRequestMock({ [UTM.MEDIUM]: medium })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.attributionProducer(request).medium).toBe(medium)
  })

  it('gets campaign utm_medium attribute from querystring', async () => {
    const campaign = 'campaign-99'
    const request = generateRequestMock({ [UTM.CAMPAIGN]: campaign })
    await init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.attributionProducer(request).campaign).toBe(campaign)
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
