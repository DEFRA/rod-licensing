import { initialize, injectWithCookie, postRedirectGet, start, stop } from '../../__mocks__/test-utils'
import { MOCK_CONCESSIONS, JUNIOR_12_MONTH_LICENCE } from '../../__mocks__/mock-journeys.js'
import { AGREED, FINALISED, ORDER_COMPLETE, TEST_STATUS, TERMS_AND_CONDITIONS } from '../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The finalisation handler', () => {
  it('throws a status 403 (forbidden) exception if the agreed flag is not set', async () => {
    const data = await injectWithCookie('GET', FINALISED.uri)
    expect(data.statusCode).toBe(403)
  })

  it('throws a status 403 (forbidden) exception if the posted flag is not set', async () => {
    await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
    const data = await injectWithCookie('GET', FINALISED.uri)
    expect(data.statusCode).toBe(403)
  })

  it('throws an error and the finalised flag is unset where the API call for finalisation throws an error', async () => {
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
    fetch.mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error())))
    const data = await injectWithCookie('GET', FINALISED.uri)
    expect(data.statusCode).toBe(500)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status).agreed).toBeTruthy()
    expect(JSON.parse(status).posted).toBeTruthy()
    expect(JSON.parse(status).finalised).not.toBeTruthy()
  })

  it('throws an error and the finalised flag is unset  where the API call for finalisation returns an error', async () => {
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
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            ok: false,
            statusText: 'error'
          })
        )
    )
    const data = await injectWithCookie('GET', FINALISED.uri)
    expect(data.statusCode).toBe(500)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status).agreed).toBeTruthy()
    expect(JSON.parse(status).posted).toBeTruthy()
    expect(JSON.parse(status).finalised).not.toBeTruthy()
  })

  it("for an %s posts the transaction payload and sets the 'posted' flag and redirects to the finalised handler", async () => {
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
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            ok: true
          })
        )
    )
    const data = await injectWithCookie('GET', FINALISED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ORDER_COMPLETE.uri)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status).agreed).toBeTruthy()
    expect(JSON.parse(status).posted).toBeTruthy()
    expect(JSON.parse(status).finalised).toBeTruthy()
  })

  it('once completed causes subsequent calls to the agreed handler to be redirected to order completion', async () => {
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ORDER_COMPLETE.uri)
  })

  it('once completed causes subsequent calls to the finalised handler to be redirected to order completion', async () => {
    const data = await injectWithCookie('GET', FINALISED.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ORDER_COMPLETE.uri)
  })
})
