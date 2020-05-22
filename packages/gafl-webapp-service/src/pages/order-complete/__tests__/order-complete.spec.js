import { initialize, injectWithCookies, postRedirectGet, start, stop } from '../../../__mocks__/test-utils'
import { MOCK_CONCESSIONS, JUNIOR_12_MONTH_LICENCE } from '../../../__mocks__/mock-journeys.js'
import { AGREED, ORDER_COMPLETE, TERMS_AND_CONDITIONS, ORDER_COMPLETE_PDF } from '../../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The order completion handler', () => {
  it('throws a status 403 (forbidden) exception if the agreed flag is not set', async () => {
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })

  it('throws a status 403 (forbidden) exception if the posted flag is not set', async () => {
    await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })

  it('throw a status 403 (forbidden) exception if the finalized flag is not set', async () => {
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
      // Mock response from sales API - create transaction
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => JUNIOR_12_MONTH_LICENCE.transActionResponse,
              ok: true
            })
          )
      )

    await injectWithCookies('GET', AGREED.uri)
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })

  it('responds with the order completed page if the journey has finished', async () => {
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
      // Mock response from sales API - create transaction
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => JUNIOR_12_MONTH_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ ok: true })))

    const data1 = await injectWithCookies('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(ORDER_COMPLETE.uri)
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(200)
  })

  it('responds with the order completed pdf when requested', async () => {
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
      // Mock response from sales API - create transaction
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => JUNIOR_12_MONTH_LICENCE.transActionResponse,
              ok: true
            })
          )
      )
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ ok: true })))

    await injectWithCookies('GET', AGREED.uri)
    await injectWithCookies('GET', ORDER_COMPLETE.uri)
    const data = await injectWithCookies('GET', ORDER_COMPLETE_PDF.uri)
    expect(data.statusCode).toBe(200)
  })
})
