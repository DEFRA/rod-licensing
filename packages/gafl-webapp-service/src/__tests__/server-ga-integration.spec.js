import HapiGapi from 'hapi-gapi'
import Hapi from '@hapi/hapi'
import { createServer, init } from '../server.js'

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
    init()
    expect(getHapiGapiPlugin()).not.toBeUndefined()
  })

  it('passes sessionIdProducer that gets session id from process.env', () => {
    const cookieName = 'Bourbon-1272'
    process.env.SESSION_COOKIE_NAME = cookieName
    init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.sessionIdProducer()).toBe(cookieName)
  })

  it('if session cookie hasn\'t been set, use default value for sessionIdProducer', () => {
    const cookieName = 'Garibaldi-1807'
    delete process.env.SESSION_COOKIE_NAME
    process.env.SESSION_COOKIE_NAME_DEFAULT = cookieName
    init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.sessionIdProducer()).toBe(cookieName)
  })

  it('gets campaign utm_medium attribute from querystring', () => {
    const fakeRequest = { query: { utm_medium: 'banner' } }
    init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.attributionProducer(fakeRequest).medium).toBe(fakeRequest.query.utm_medium)
  })

  it('gets campaign utm_medium attribute from querystring', () => {
    const fakeRequest = { query: { utm_campaign: 'campaign-99' } }
    init()
    const hapiGapiPlugin = getHapiGapiPlugin()
    expect(hapiGapiPlugin.options.attributionProducer(fakeRequest).campaign).toBe(fakeRequest.query.utm_campaign)
  })

  const getHapiGapiPlugin = () => {
    const mockServer = Hapi.server.mock.results[0].value
    const [plugins] = mockServer.register.mock.calls[0]
    return plugins.find(p => p.plugin === HapiGapi)
  }
})
