import { dobHelper, ADULT_TODAY } from '../../../../__mocks__/test-utils-business-rules.js'
import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../__mocks__/test-utils-system.js'

import {
  NAME,
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
import { disabilityConcessionTypes } from '../../../concessions/disability/update-transaction.js'
import { findPermit } from '../../../../processors/find-permit.js'

mockSalesApi()
jest.mock('../../../../processors/find-permit.js', () => ({
  findPermit: jest.fn()
}))

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'GJDJKDKFJ'
  process.env.ANALYTICS_PROPERTY_API = 'XHHDjknw-sadcC'
})

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_PROPERTY_API
})

describe('The licence summary page', () => {
  describe('where the prerequisite are not fulfilled', () => {
    beforeAll(async () => {
      await injectWithCookies('GET', CONTROLLER.uri)
    })

    it('redirects to the date of birth page if the date of birth has been not been set', async () => {
      await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
    })

    it('redirects to the licence to start page if no licence start date has been set', async () => {
      await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_TO_START.uri)
    })

    it('redirects to the licence type page if no licence type has been set', async () => {
      await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_TYPE.uri)
    })

    it('redirects to the licence length page if no length has been set', async () => {
      await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
    })
  })

  describe('for a full 12 month, 2 rod, trout and coarse licence', () => {
    beforeAll(async () => {
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    })

    beforeEach(() => {
      jest.resetAllMocks()
    })

    it('re-filters the correct permit on a material change', async () => {
      findPermit.mockImplementationOnce(() => ({
        licensee: {
          firstName: 'Willis',
          lastName: 'Graham',
          birthDate: '2006-06-06'
        },
        licenceLength: '12M',
        startDate: '2023-04-01',
        permit: {
          newCostStartDate: '2023-04-01',
          newCost: 1,
          description: 'Coarse 12 month 3 Rod Licence (Full)'
        }
      }))
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse3Rod })
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permit = JSON.parse(payload).permissions[0].permit
      expect(permit.description).toEqual('Coarse 12 month 3 Rod Licence (Full)')
    })

    it('filters the correct permit', async () => {
      findPermit.mockImplementationOnce(() => ({
        licensee: {
          firstName: 'Willis',
          lastName: 'Graham',
          birthDate: '2006-06-06'
        },
        licenceLength: '12M',
        startDate: '2023-04-01',
        permit: {
          newCostStartDate: '2023-04-01',
          newCost: 1,
          description: 'Coarse 12 month 2 Rod Licence (Full)'
        }
      }))
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permit = JSON.parse(payload).permissions[0].permit
      expect(permit.description).toEqual('Coarse 12 month 2 Rod Licence (Full)')
    })

    it('displays the page on request', async () => {
      findPermit.mockImplementationOnce(() => ({
        licensee: {
          firstName: 'Willis',
          lastName: 'Graham',
          birthDate: '2006-06-06',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          postalFulfilment: false,
          preferredMethodOfConfirmation: 'Prefer not to be contacted',
          preferredMethodOfReminder: 'Prefer not to be contacted',
          mobilePhone: null,
          email: null
        },
        licenceLength: '12M',
        startDate: '2023-04-01',
        permit: {
          newCostStartDate: '2023-04-01',
          newCost: 1,
          isForFulfilment: true
        }
      }))
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(200)
    })
  })

  describe('for a disabled concession 12 month, 2 rod, trout and coarse licence', () => {
    beforeAll(async () => {
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
        'disability-concession': disabilityConcessionTypes.pipDla,
        'ni-number': 'NH 34 67 44 A'
      })
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    })

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('displays the page on request', async () => {
      findPermit.mockImplementationOnce(() => ({
        licensee: {
          firstName: 'Willis',
          lastName: 'Graham',
          birthDate: '2006-06-06'
        },
        licenceLength: '12M',
        startDate: '2023-04-01',
        permit: {
          newCostStartDate: '2023-04-01',
          newCost: 1
        }
      }))
      const response = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      expect(response.statusCode).toBe(200)
    })

    it('filters the correct permit', async () => {
      findPermit.mockImplementationOnce(() => ({
        licensee: {
          firstName: 'Willis',
          lastName: 'Graham',
          birthDate: '2006-06-06'
        },
        licenceLength: '12M',
        startDate: '2023-04-01',
        permit: {
          newCostStartDate: '2023-04-01',
          newCost: 1,
          description: 'Coarse 12 month 2 Rod Licence (Full, Disabled)'
        }
      }))
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permit = JSON.parse(payload).permissions[0].permit
      expect(permit.description).toEqual('Coarse 12 month 2 Rod Licence (Full, Disabled)')
    })
  })
})
