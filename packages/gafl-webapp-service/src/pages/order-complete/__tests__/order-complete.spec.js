import { salesApi } from '@defra-fish/connectors-lib'

import { initialize, injectWithCookies, postRedirectGet, start, stop } from '../../../__mocks__/test-utils'
import { JUNIOR_12_MONTH_LICENCE } from '../../../__mocks__/mock-journeys.js'
import { AGREED, ORDER_COMPLETE, TERMS_AND_CONDITIONS, ORDER_COMPLETE_PDF } from '../../../uri.js'
import mockPermits from '../../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../../__mocks__/data/permit-concessions.js'
import mockConcessions from '../../../__mocks__/data/concessions.js'
import mockDefraCountries from '../../../__mocks__/data/defra-country.js'

jest.mock('@defra-fish/connectors-lib')
salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
salesApi.permitConcessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermitsConcessions)))
salesApi.concessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockConcessions)))
salesApi.countries.getAll = jest.fn(async () => new Promise(resolve => resolve(mockDefraCountries)))

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
})
beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_XGOV_PROPERTY
})

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

    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(JUNIOR_12_MONTH_LICENCE.transActionResponse)))

    salesApi.finaliseTransaction = jest.fn(async () =>
      new Promise((resolve, reject) => reject(new Error())))

    await injectWithCookies('GET', AGREED.uri)
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })

  it('responds with the order completed page if the journey has finished', async () => {
    await JUNIOR_12_MONTH_LICENCE.setup()

    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(JUNIOR_12_MONTH_LICENCE.transActionResponse)))

    salesApi.finaliseTransaction = jest.fn(async () =>
      new Promise(resolve => resolve({ ok: true })))

    const data1 = await injectWithCookies('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(ORDER_COMPLETE.uri)
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(200)
  })

  it('responds with the order completed pdf when requested', async () => {
    await JUNIOR_12_MONTH_LICENCE.setup()
    salesApi.createTransaction = jest.fn(async () =>
      new Promise(resolve => resolve(JUNIOR_12_MONTH_LICENCE.transActionResponse)))

    salesApi.finaliseTransaction = jest.fn(async () =>
      new Promise(resolve => resolve({ ok: true })))

    await injectWithCookies('GET', AGREED.uri)
    await injectWithCookies('GET', ORDER_COMPLETE.uri)
    const data = await injectWithCookies('GET', ORDER_COMPLETE_PDF.uri)
    expect(data.statusCode).toBe(200)
  })
})
