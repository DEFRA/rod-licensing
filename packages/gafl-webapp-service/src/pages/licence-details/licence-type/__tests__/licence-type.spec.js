import { LICENCE_TYPE, TEST_TRANSACTION, LICENCE_SUMMARY, DATE_OF_BIRTH, LICENCE_TO_START, LICENCE_LENGTH } from '../../../../uri.js'
import * as mappings from '../../../../processors/mapping-constants.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'
import { licenseTypes } from '../route.js'
import { JUNIOR_TODAY, ADULT_TODAY, dobHelper } from '../../../../__mocks__/test-helpers'
import { licenceToStart } from '../../licence-to-start/update-transaction'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The licence type page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', LICENCE_TYPE.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', LICENCE_TYPE.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_TYPE.uri)
  })

  it('redirects back to itself on posting an invalid response', async () => {
    const response = await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': 'hunting-licence' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_TYPE.uri)
  })

  it.each([
    ['Salmon and sea trout', { postData: licenseTypes.salmonAndSeaTrout, type: mappings.LICENCE_TYPE['salmon-and-sea-trout'], rods: '1' }],
    ['Trout and coarse, 2 rod', { postData: licenseTypes.troutAndCoarse2Rod, type: mappings.LICENCE_TYPE['trout-and-coarse'], rods: '2' }],
    ['Trout and coarse, 3 rod', { postData: licenseTypes.troutAndCoarse3Rod, type: mappings.LICENCE_TYPE['trout-and-coarse'], rods: '3' }]
  ])('stores the transaction on successful submission of %s', async (desc, d) => {
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': d.postData })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licenceType).toBe(d.type)
    expect(JSON.parse(payload).permissions[0].numberOfRods).toBe(d.rods)
  })

  it('on success redirects directly to the summary page for a junior licence', async () => {
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    const response = await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': licenseTypes.salmonAndSeaTrout })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('on success redirects to the length page for an adult', async () => {
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    const response = await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': licenseTypes.salmonAndSeaTrout })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
  })
})
