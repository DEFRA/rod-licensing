import { start, stop, initialize, injectWithCookies } from '../__mocks__/test-utils-system.js'
import { initialise as initialiseOIDC } from '../handlers/oidc-handler.js'
import { LICENCE_LENGTH } from '../uri.js'

jest.mock('../handlers/oidc-handler.js')

beforeAll(() => {
  process.env.CHANNEL = 'telesales'
  start(() => {})
})

beforeAll(() => initialize(() => {}))
afterAll(() => stop(() => {}))

describe('Where the server started in telesales mode', () => {
  it('telesales is displayed in the header', async () => {
    const data = await injectWithCookies('GET', LICENCE_LENGTH.uri)
    expect(data.payload.includes('TELESALES')).toBeTruthy()
  })

  it('initialises OIDC when started', async () => {
    expect(initialiseOIDC).toHaveBeenCalled()
  })
})
