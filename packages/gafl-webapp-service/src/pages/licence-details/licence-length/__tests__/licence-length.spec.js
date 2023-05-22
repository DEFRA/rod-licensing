import { LICENCE_LENGTH, LICENCE_SUMMARY, LICENCE_START_TIME, LICENCE_TYPE, TEST_TRANSACTION, CONTACT } from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../__mocks__/test-utils-system.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

mockSalesApi()

describe('The licence length page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', LICENCE_LENGTH.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', LICENCE_LENGTH.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('redirects back to itself on posting an invalid response', async () => {
    const response = await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '8M' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it.each([
    ['12 months', '12M'],
    ['8 day', '8D'],
    ['1 day', '1D']
  ])('stores the transaction on a successful submission of %s', async (desc, lenCode) => {
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': lenCode })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe(lenCode)
  })

  it('redirects into the licence summary page for licence length of 12 months', async () => {
    const response = await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it.each([
    ['8 day', '8D'],
    ['1 day', '1D']
  ])('redirects into the time to start page for licence length %s', async (desc, lenCode) => {
    const response = await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': lenCode })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_START_TIME.uri)
  })

  it("where contact is 'none' setting a 12 month licence changes it to 'post'", async () => {
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse-2-rod' })
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'none' })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.letter)
  })

  it("where contact is 'none' setting a 12 month licence, then changing it to 1 day sets preferredMethodOfConfirmation to none and sets postalFulfilment to false", async () => {
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse-2-rod' })
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'none' })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const { payload: payload2 } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload2).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload2).permissions[0].licensee.postalFulfilment).toBeFalsy()
  })

  it("where contact is 'none', setting a 1 day licence keeps it at 'none'", async () => {
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse-2-rod' })
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'none' })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
  })

  it("where contact is 'none' setting a 1 day licence, then changing to 12 months sets preferredMethodOfConfirmation to letter and set postalFulfilment to true", async () => {
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse-2-rod' })
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'none' })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    const { payload: payload2 } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload2).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.letter)
    expect(JSON.parse(payload2).permissions[0].licensee.postalFulfilment).toBeTruthy()
  })
})
