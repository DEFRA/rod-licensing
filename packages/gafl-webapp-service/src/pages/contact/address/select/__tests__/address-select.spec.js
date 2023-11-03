import {
  ADDRESS_SELECT,
  LICENCE_FULFILMENT,
  CONTACT,
  ADDRESS_LOOKUP,
  TEST_TRANSACTION,
  CONTACT_SUMMARY,
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_SUMMARY,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NAME,
  NEWSLETTER
} from '../../../../../uri.js'
import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../../__mocks__/test-utils-system.js'
import searchResultsMany from '../../../../../services/address-lookup/__mocks__/data/search-results-many'

import { ADULT_TODAY, JUNIOR_TODAY, dobHelper } from '../../../../../__mocks__/test-utils-business-rules'
import { licenceToStart } from '../../../../licence-details/licence-to-start/update-transaction'
import { licenseTypes } from '../../../../licence-details/licence-type/route'
import { isPhysical } from '../../../../../processors/licence-type-display.js'

jest.mock('../../../../../processors/licence-type-display.js')

mockSalesApi()

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The address select page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', ADDRESS_SELECT.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting an empty payload', async () => {
    const response = await injectWithCookies('POST', ADDRESS_SELECT.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(ADDRESS_SELECT.uri)
  })

  it('redirects back to itself on posting an no address', async () => {
    const response = await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(ADDRESS_SELECT.uri)
  })

  describe('on successful submission', () => {
    beforeEach(async () => {
      // Set up the licence details
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      await injectWithCookies('POST', LICENCE_SUMMARY.uri)

      // Set up the contact details
      await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
      process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
      process.env.ADDRESS_LOOKUP_KEY = 'bar'
      fetch.mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => searchResultsMany,
              ok: true
            })
          )
      )
      await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
      await injectWithCookies('GET', ADDRESS_SELECT.uri)
      await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '5' })
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
      await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'yes', 'email-entry': 'no' })
    })

    it('redirects to the contact page if licence length is 1 day', async () => {
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
      const response = await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '5' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(CONTACT.uri)
    })

    it('redirects to the contact page if licence length is 8 day', async () => {
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '8D' })
      const response = await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '5' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(CONTACT.uri)
    })

    it('redirects to the contact page if licence length is is 12 months and junior', async () => {
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      const response = await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '5' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(CONTACT.uri)
    })

    it('redirects to the licence fulfilment page if licence length is 12 months and not junior', async () => {
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      isPhysical.mockReturnValueOnce(true)
      const response = await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '5' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(LICENCE_FULFILMENT.uri)
    })

    it('redirects to the summary page if the summary page is seen', async () => {
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '8D' })
      await injectWithCookies('GET', CONTACT_SUMMARY.uri)
      const response = await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '5' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(CONTACT_SUMMARY.uri)
    })

    it('The contact information has been set in the transaction', async () => {
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          premises: '14 HOWECROFT COURT',
          street: 'EASTMEAD LANE',
          town: 'BRISTOL',
          postcode: 'BS9 1HJ',
          countryCode: 'GB'
        })
      )
    })
  })

  it('Select and address with no street', async () => {
    await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '6' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    const {
      permissions: [{ licensee }]
    } = JSON.parse(payload)
    expect(licensee).toEqual(
      expect.objectContaining({
        premises: '15 HOWECROFT COURT',
        town: 'BRISTOL',
        postcode: 'BS9 1HJ',
        countryCode: 'GB'
      })
    )
  })

  it('Select and address with a locality', async () => {
    await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '7' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    const {
      permissions: [{ licensee }]
    } = JSON.parse(payload)
    expect(licensee).toEqual(
      expect.objectContaining({
        premises: '16 HOWECROFT COURT',
        street: 'EASTMEAD LANE',
        locality: 'Sneyd Park',
        town: 'BRISTOL',
        postcode: 'BS9 1HJ',
        countryCode: 'GB'
      })
    )
  })
})
