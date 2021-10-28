import { LICENCE_FOR, NEW_TRANSACTION, TEST_STATUS } from '../../../../uri.js'

import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

describe('The licence for page', () => {
  beforeAll(async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
  })

  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', LICENCE_FOR.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects to licence-for page on unsuccessful submission', async () => {
    const response = await injectWithCookies('POST', LICENCE_FOR.uri, {
      'licence-for': 'none'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_FOR.uri)
  })

  it('post response you sets isLicenceForYou to true in status cache', async () => {
    await injectWithCookies('POST', LICENCE_FOR.uri, {
      'licence-for': 'you'
    })
    const { payload } = await injectWithCookies('GET', TEST_STATUS.uri)
    expect(JSON.parse(payload).permissions[0].isLicenceForYou).toEqual(true)
  })

  it('post response someone-else sets isLicenceForYou to false in status cache', async () => {
    await injectWithCookies('POST', LICENCE_FOR.uri, {
      'licence-for': 'someone-else'
    })
    const { payload } = await injectWithCookies('GET', TEST_STATUS.uri)
    expect(JSON.parse(payload).permissions[0].isLicenceForYou).toEqual(false)
  })
})
