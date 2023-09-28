import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../__mocks__/test-utils-system.js'
import { DISABILITY_CONCESSION, LICENCE_TO_START, TEST_TRANSACTION, LICENCE_LENGTH } from '../../../../uri.js'
import { disabilityConcessionTypes } from '../update-transaction.js'
import * as concessionHelper from '../../../../processors/concession-helper.js'
import { CONCESSION_PROOF } from '../../../../processors/mapping-constants.js'

mockSalesApi()

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

describe('The disability concession page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', DISABILITY_CONCESSION.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting an empty payload', async () => {
    const response = await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${DISABILITY_CONCESSION.uri}#`)
  })

  it('redirects back to itself on posting PIP with an invalid NI number', async () => {
    const response = await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.pipDla,
      'ni-number': 'not-valid'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${DISABILITY_CONCESSION.uri}#`)
  })

  it('redirects back to itself on posting blue badge with an empty blue number', async () => {
    const response = await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.blueBadge,
      'blue-badge-number': ''
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${DISABILITY_CONCESSION.uri}#`)
  })

  it('on setting a correct ni number it redirects to the licence-to-start page', async () => {
    const response = await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.pipDla,
      'ni-number': 'NH 34 67 44 A'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${LICENCE_TO_START.uri}#`)
  })

  it('on setting a correct ni number adds a disabled concession to the cache', async () => {
    await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.pipDla,
      'ni-number': 'NH 34 67 44 A'
    })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(concessionHelper.hasDisabled(JSON.parse(payload).permissions[0])).toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concessions[0].proof).toEqual({
      type: CONCESSION_PROOF.NI,
      referenceNumber: 'NH 34 67 44 A'
    })
  })

  it('on setting a correct blue badge number redirects to the licence-to-start page', async () => {
    const response = await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.blueBadge,
      'blue-badge-number': '1234'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${LICENCE_TO_START.uri}#`)
  })

  it('on setting a correct blue badge number adds a disabled concession to the cache', async () => {
    await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.blueBadge,
      'blue-badge-number': '1234'
    })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(concessionHelper.hasDisabled(JSON.parse(payload).permissions[0])).toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concessions[0].proof).toEqual({
      type: CONCESSION_PROOF.blueBadge,
      referenceNumber: '1234'
    })
  })

  it('on setting a disability concession and changing to a 8 day licence and back, the concession is restored', async () => {
    await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.blueBadge,
      'blue-badge-number': '1234'
    })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '8D' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(concessionHelper.hasDisabled(JSON.parse(payload).permissions[0])).not.toBeTruthy()
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    const { payload: payload2 } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(concessionHelper.hasDisabled(JSON.parse(payload2).permissions[0])).toBeTruthy()
    expect(JSON.parse(payload2).permissions[0].concessions[0].proof).toEqual({
      type: CONCESSION_PROOF.blueBadge,
      referenceNumber: '1234'
    })
  })

  it("on setting 'no' does not add disabled concession to the cache", async () => {
    await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.no
    })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(concessionHelper.hasDisabled(JSON.parse(payload).permissions[0])).not.toBeTruthy()
  })

  it("on setting 'no' it causes a redirect to the licence-to-start page", async () => {
    const response = await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.no
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${LICENCE_TO_START.uri}#`)
  })
})
