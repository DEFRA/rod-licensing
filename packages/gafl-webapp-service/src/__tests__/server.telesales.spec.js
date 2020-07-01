import { start, stop, initialize, injectWithCookies } from '../__mocks__/test-utils.js'
import { LICENCE_LENGTH } from '../uri.js'

beforeAll(d => {
  process.env.CHANNEL = 'telesales'
  start(d)
})

beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('Where the server started in telesales mode', () => {
  it('telesales is displayed in the header', async () => {
    const data = await injectWithCookies('GET', LICENCE_LENGTH.uri)
    expect(data.payload.includes('TELESALES')).toBeTruthy()
  })
})
