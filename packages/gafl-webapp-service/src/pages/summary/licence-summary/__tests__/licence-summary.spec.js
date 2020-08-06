import { salesApi } from '@defra-fish/connectors-lib'
import mockPermits from '../../../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../../../__mocks__/data/permit-concessions.js'
import mockConcessions from '../../../../__mocks__/data/concessions.js'
import { dobHelper, ADULT_TODAY } from '../../../../__mocks__/test-helpers.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

import {
  LICENCE_SUMMARY,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  LICENCE_TO_START,
  DATE_OF_BIRTH,
  CONTROLLER,
  DISABILITY_CONCESSION,
  TEST_TRANSACTION
} from '../../../../uri.js'

import { licenceToStart } from '../../../licence-details/licence-to-start/update-transaction.js'
import { licenseTypes } from '../../../licence-details/licence-type/route.js'
import { disabilityConcessionTypes } from '../../../concessions/disability/route.js'

salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
salesApi.permitConcessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermitsConcessions)))
salesApi.concessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockConcessions)))

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

describe('The licence summary page', () => {
  describe('where the prerequisite are not fulfilled', async () => {
    beforeAll(async d => {
      await injectWithCookies('GET', CONTROLLER.uri)
      d()
    })

    it('redirects to the date of birth page if the date of birth has been not been set', async () => {
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
    })

    it('redirects to the licence to start page if no licence start date has been set', async () => {
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_TO_START.uri)
    })

    it('redirects to the licence type page if no licence type has been set', async () => {
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_TYPE.uri)
    })

    it('redirects to the licence length page if no length has been set', async () => {
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
    })
  })

  describe('for a full 12 month, 2 rod, trout and coarse licence', async () => {
    beforeAll(async d => {
      await injectWithCookies('GET', CONTROLLER.uri)
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      d()
    })

    it('displays the page on request', async () => {
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(200)
    })

    it('filters the correct permit', async () => {
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permit = JSON.parse(payload).permissions[0].permit
      expect(permit.description).toEqual('Coarse 12 month 2 Rod Licence (Full)')
    })

    it('re-filters the correct permit on a material change', async () => {
      await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse3Rod })
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permit = JSON.parse(payload).permissions[0].permit
      expect(permit.description).toEqual('Coarse 12 month 3 Rod Licence (Full)')
    })
  })

  describe('for a disabled concession 12 month, 2 rod, trout and coarse licence', async () => {
    beforeAll(async d => {
      await injectWithCookies('GET', CONTROLLER.uri)
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await postRedirectGet(DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.pipDla,
        'ni-number': 'NH 34 67 44 A'
      })
      await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      d()
    })

    it('displays the page on request', async () => {
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(200)
    })

    it('filters the correct permit', async () => {
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permit = JSON.parse(payload).permissions[0].permit
      expect(permit.description).toEqual('Coarse 12 month 2 Rod Licence (Full, Disabled)')
    })
  })
})
