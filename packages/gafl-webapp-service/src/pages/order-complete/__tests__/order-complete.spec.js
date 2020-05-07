import { initialize, injectWithCookie, postRedirectGet, start, stop } from '../../../__mocks__/test-utils'
import { MOCK_CONCESSIONS, JUNIOR_12_MONTH_LICENCE } from '../../../__mocks__/mock-journeys.js'
import { AGREED, ORDER_COMPLETE, TEST_STATUS, TERMS_AND_CONDITIONS } from '../../../uri.js'
import { COMPLETION_STATUS } from '../../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The order completion handler', () => {
  it('throw a status 403 (forbidden) exception if the agreed flag is not set', async () => {
    const data = await injectWithCookie('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })

  it('throw a status 403 (forbidden) exception if the posted flag is not set', async () => {
    await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
    const data = await injectWithCookie('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })
})
