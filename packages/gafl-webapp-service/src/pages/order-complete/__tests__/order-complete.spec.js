import { initialize, injectWithCookie, postRedirectGet, start, stop } from '../../../__mocks__/test-utils'
import { MOCK_CONCESSIONS, JUNIOR_12_MONTH_LICENCE } from '../../../__mocks__/mock-journeys.js'

import { AGREED, FINALISED, ORDER_COMPLETE, TEST_STATUS, TERMS_AND_CONDITIONS } from '../../../uri.js'

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

  it('throw a status 403 (forbidden) exception if the finalised flag is not set', async () => {
    await JUNIOR_12_MONTH_LICENCE.setup()
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
              json: () => JUNIOR_12_MONTH_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
    await injectWithCookie('GET', AGREED.uri)
    const data = await injectWithCookie('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })

  it('returns the page successfully if the transaction is finalised and sets the completed flag', async () => {
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            ok: true
          })
        )
    )
    await injectWithCookie('GET', FINALISED.uri)
    const data = await injectWithCookie('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(200)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status).agreed).toBeTruthy()
    expect(JSON.parse(status).posted).toBeTruthy()
    expect(JSON.parse(status).finalised).toBeTruthy()
    expect(JSON.parse(status).completed).toBeTruthy()
  })

  it('after finalisation subsequent calls to the agreed handler redirect to order complete', async () => {
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ORDER_COMPLETE.uri)
  })
})
