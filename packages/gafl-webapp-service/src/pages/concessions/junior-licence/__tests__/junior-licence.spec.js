import {
  JUNIOR_LICENCE,
  CONTROLLER,
  LICENCE_SUMMARY,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_TYPE,
  BENEFIT_CHECK
} from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The junior licence page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookies('GET', JUNIOR_LICENCE.uri)
    expect(data.statusCode).toBe(200)
  })
  it('on submission redirects to the licence summary', async () => {
    await injectWithCookies('POST', JUNIOR_LICENCE.uri)
    const data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
  })
  it('on submission redirects to the benefits page if a 12 month', async () => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    const data = await postRedirectGet(JUNIOR_LICENCE.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BENEFIT_CHECK.uri)
  })
})
