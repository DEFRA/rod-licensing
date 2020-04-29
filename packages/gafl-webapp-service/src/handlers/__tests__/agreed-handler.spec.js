import { initialize, injectWithCookie, start, stop } from '../../__mocks__/test-utils'
import { ADULT_FULL_1_DAY_LICENCE, MOCK_CONCESSIONS } from '../../__mocks__/mock-journeys.js'
import { AGREED, FINALISED, TEST_TRANSACTION } from '../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The agreed handler', () => {
  it('throw a status 403 (forbidden) exception is the agreed flag is not set', async () => {
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(403)
  })

  it("posts the transaction payload and sets the 'posted' flag and redirects to the finalised handler on a zero cost licence", async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => MOCK_CONCESSIONS,
              ok: true
            })
          )
      )
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(FINALISED.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    console.log(payload)
  })
})
