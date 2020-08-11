import {
  ADDRESS_SELECT,
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
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../../__mocks__/test-utils.js'
import searchResultsMany from '../../../../../services/address-lookup/__mocks__/data/search-results-many'

import { ADULT_TODAY, dobHelper } from '../../../../../__mocks__/test-helpers'
import { licenceToStart } from '../../../../licence-details/licence-to-start/update-transaction'
import { licenseTypes } from '../../../../licence-details/licence-type/route'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
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
    expect(response.headers.location).toBe(ADDRESS_SELECT.uri)
  })

  it('redirects back to itself on posting an no address', async () => {
    const response = await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADDRESS_SELECT.uri)
  })

  describe('on successful submission', async () => {
    beforeEach(async d => {
      // Set up the licence details
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      await postRedirectGet(LICENCE_SUMMARY.uri)

      // Set up the contact details
      await postRedirectGet(NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
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
      await postRedirectGet(ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
      await injectWithCookies('GET', ADDRESS_SELECT.uri)
      await postRedirectGet(ADDRESS_SELECT.uri, { address: '5' })
      await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
      await postRedirectGet(NEWSLETTER.uri, { newsletter: 'yes', 'email-entry': 'no' })
      d()
    })

    it('redirects to the contact page', async () => {
      const response = await postRedirectGet(ADDRESS_SELECT.uri, { address: '5' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT.uri)
    })

    it('redirects to the summary page if the summary page is seen', async () => {
      await injectWithCookies('GET', CONTACT_SUMMARY.uri)
      const response = await postRedirectGet(ADDRESS_SELECT.uri, { address: '5' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
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
    await postRedirectGet(ADDRESS_SELECT.uri, { address: '6' })
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
    await postRedirectGet(ADDRESS_SELECT.uri, { address: '7' })
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
