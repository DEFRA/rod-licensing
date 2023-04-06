import {
  LICENCE_TYPE,
  TEST_TRANSACTION,
  LICENCE_SUMMARY,
  DATE_OF_BIRTH,
  LICENCE_TO_START,
  LICENCE_LENGTH,
  DISABILITY_CONCESSION,
  NEW_TRANSACTION
} from '../../../../uri.js'
import * as mappings from '../../../../processors/mapping-constants.js'
import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../__mocks__/test-utils-system.js'
import { licenseTypes } from '../route.js'
import { JUNIOR_TODAY, ADULT_TODAY, dobHelper } from '../../../../__mocks__/test-utils-business-rules'
import { licenceToStart } from '../../licence-to-start/update-transaction.js'
import { disabilityConcessionTypes } from '../../../concessions/disability/update-transaction.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

mockSalesApi()

describe('The licence type page', () => {
  it('returns success on requesting', async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.blueBadge,
      'blue-badge-number': '1234'
    })
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
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': d.postData })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licenceType).toBe(d.type)
    expect(JSON.parse(payload).permissions[0].numberOfRods).toBe(d.rods)
  })

  it('on success redirects directly to the summary page for a junior licence', async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    const response = await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.salmonAndSeaTrout })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('on success redirects directly to the length page for a disabled concession', async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.blueBadge,
      'blue-badge-number': '1234'
    })
    const response = await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.salmonAndSeaTrout })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('on success redirects directly to the summary page for a 3 rod licence', async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    const response = await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse3Rod })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('on success redirects to the length page for an adult', async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    const response = await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.salmonAndSeaTrout })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
  })
})
