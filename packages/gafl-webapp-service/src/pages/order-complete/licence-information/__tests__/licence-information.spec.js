import { salesApi } from '@defra-fish/connectors-lib'

import { initialize, injectWithCookies, start, stop, mockSalesApi } from '../../../../__mocks__/test-utils-system'
import { JUNIOR_LICENCE } from '../../../../__mocks__/mock-journeys.js'
import { AGREED, TERMS_AND_CONDITIONS, LICENCE_INFORMATION } from '../../../../uri.js'

jest.mock('@defra-fish/connectors-lib')
mockSalesApi()

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

describe('The licence information page', () => {
  it('throws a status 403 (forbidden) exception if the agreed flag is not set', async () => {
    const data = await injectWithCookies('GET', LICENCE_INFORMATION.uri)
    expect(data.statusCode).toBe(403)
  })

  it('throws a status 403 (forbidden) exception if the posted flag is not set', async () => {
    await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
    const data = await injectWithCookies('GET', LICENCE_INFORMATION.uri)
    expect(data.statusCode).toBe(403)
  })

  it('throw a status 403 (forbidden) exception if the finalized flag is not set', async () => {
    await JUNIOR_LICENCE.setup()
    salesApi.createTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockRejectedValue(new Error())

    await injectWithCookies('GET', AGREED.uri)
    const data = await injectWithCookies('GET', LICENCE_INFORMATION.uri)
    expect(data.statusCode).toBe(403)
  })

  it('responds with the licence information page when requested', async () => {
    await JUNIOR_LICENCE.setup()
    salesApi.createTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)

    await injectWithCookies('GET', AGREED.uri)
    const data = await injectWithCookies('GET', LICENCE_INFORMATION.uri)
    expect(data.statusCode).toBe(200)
  })
})
