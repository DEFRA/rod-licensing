import moment from 'moment'
import {
  IDENTIFY,
  AUTHENTICATE,
  CONTROLLER,
  LICENCE_SUMMARY,
  RENEWAL_PUBLIC,
  RENEWAL_INACTIVE,
  LICENCE_LENGTH,
  CONTACT_SUMMARY,
  NEW_TRANSACTION,
  LICENCE_NOT_FOUND
} from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../__mocks__/test-utils-system.js'

import { dobHelper, ADULT_TODAY } from '../../../../__mocks__/test-utils-business-rules.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { RENEW_AFTER_DAYS, RENEW_BEFORE_DAYS } from '@defra-fish/business-rules-lib'
import { authenticationResult } from '../__mocks__/data/authentication-result.js'
import * as constants from '../../../../processors/mapping-constants.js'
import mockDefraCountries from '../../../../__mocks__/data/defra-country.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import pageRoute from '../../../../routes/page-route.js'

jest.mock('../../../../processors/uri-helper.js', () => ({
  ...jest.requireActual('../../../../processors/uri-helper.js'),
  addLanguageCodeToUri: jest.fn((request, uri) => uri || request.path)
}))
jest.mock('../../../../routes/page-route.js', () => jest.fn(jest.requireActual('../../../../routes/page-route.js').default))

jest.mock('../../../../processors/renewals-write-cache.js', () => ({
  setUpCacheFromAuthenticationResult: async () => {},
  setUpPayloads: async () => {}
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

const VALID_RENEWAL_PUBLIC = RENEWAL_PUBLIC.uri.replace('{referenceNumber?}', 'AAAAAA')
const VALID_RENEWAL_PUBLIC_URI = RENEWAL_PUBLIC.uri.replace('{referenceNumber?}', '')

const dobInvalid = moment().add(1, 'years')
jest.mock('@defra-fish/connectors-lib')
mockSalesApi()
salesApi.countries.getAll = jest.fn(() => Promise.resolve(mockDefraCountries))

const getPreparedRenewalData = authenticationResult => {
  const { permission } = authenticationResult
  const permitSubtypeDescription = permission?.permit?.permitSubtype?.description
  const licenceType =
    permitSubtypeDescription === 'S' ? constants.LICENCE_TYPE['salmon-and-sea-trout'] : constants.LICENCE_TYPE['trout-and-coarse']

  return {
    isRenewal: true,
    licenceLength: '12M',
    licenceType,
    numberOfRods: permission?.permit?.numberOfRods,
    isLicenceForYou: true,
    licenceToStart: constants.LICENCE_TO_START.today,
    licenceStartDate: null,
    licenceStartTime: null,
    renewedEndDate: permission.endDate,
    renewedHasExpired: false,
    licensee: {
      firstName: permission?.licensee?.firstName,
      lastName: permission?.licensee?.lastName,
      birthDate: permission?.licensee?.birthDate,
      premises: permission?.licensee?.premises,
      postcode: permission?.licensee?.postcode,
      email: permission?.licensee?.email,
      mobilePhone: permission?.licensee?.mobilePhone,
      postalFulfilment: permission?.licensee?.postalFulfilment,
      preferredMethodOfNewsletter: permission?.licensee?.preferredMethodOfNewsletter,
      preferredMethodOfConfirmation:
        permission?.licensee?.preferredMethodOfConfirmation?.label || permission?.licensee?.preferredMethodOfConfirmation,
      preferredMethodOfReminder: permission?.licensee?.preferredMethodOfReminder
    },
    concessions: permission?.concessions || []
  }
}

describe('The easy renewal identification page', () => {
  it('redirects to identify page when called with an invalid permission reference', async () => {
    const data = await injectWithCookies('GET', RENEWAL_PUBLIC.uri.replace('{referenceNumber}', 'not-a-valid-reference-number'))
    expect(data).toEqual(
      expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({
          location: expect.toHaveValidPathFor(IDENTIFY.uri)
        })
      })
    )
  })

  it('returns successfully when called with a valid reference ', async () => {
    const data = await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)

    expect(data).toEqual(
      expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({
          location: expect.toHaveValidPathFor(IDENTIFY.uri)
        })
      })
    )
  })

  it('redirects back to itself on posting an invalid postcode', async () => {
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'HHHHH' }, dobHelper(ADULT_TODAY)))

    expect(data).toEqual(
      expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({
          location: expect.toHaveValidPathFor(IDENTIFY.uri)
        })
      })
    )
  })

  it('redirects back to itself on posting an invalid data of birth', async () => {
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(dobInvalid)))

    expect(data).toEqual(
      expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({
          location: expect.toHaveValidPathFor(IDENTIFY.uri)
        })
      })
    )
  })

  it('redirects to licence not found on posting valid but not authenticated details', async () => {
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(null))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC_URI)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)

    expect(data).toEqual(
      expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({
          location: expect.toHaveValidPathFor(LICENCE_NOT_FOUND.uri)
        })
      })
    )
  })

  describe('getData', () => {
    const getData = pageRoute.mock.calls.find(c => c[0] === IDENTIFY.page)[4]

    const getMockRequest = () => ({
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: async () => ({
              referenceNumber: 'ABC123'
            }),
            setCurrentPermission: () => {}
          },
          page: {
            getCurrentPermission: async () => ({})
          }
        }
      }),
      i18n: {
        getCatalog: () => ({
          dob_error: 'mock dob_error',
          dob_error_missing_day_and_month: 'mock dob_error_missing_day_and_month',
          dob_error_missing_day_and_year: 'mock dob_error_missing_day_and_year',
          dob_error_missing_month_and_year: 'mock dob_error_missing_month_and_year',
          dob_error_missing_day: 'mock dob_error_missing_day',
          dob_error_missing_month: 'mock dob_error_missing_month',
          dob_error_missing_year: 'mock dob_error_missing_year',
          dob_error_non_numeric: 'mock dob_error_non_numeric',
          dob_error_date_real: 'mock dob_error_date_real',
          dob_error_year_min: 'mock dob_error_year_min',
          dob_error_year_max: 'mock dob_error_year_max'
        })
      }
    })

    it('passes request to addLanguageCodeToUri', async () => {
      const request = getMockRequest()
      await getData(request)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, expect.any(String))
    })

    it('passes NEW_TRANSACTION.uri to addLanguageCodeToUri', async () => {
      await getData(getMockRequest())

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(expect.any(Object), NEW_TRANSACTION.uri)
    })

    it('sets uri.new to be result of addLanguageCodeToUri', async () => {
      const decoratedUri = Symbol('new transaction uri')
      addLanguageCodeToUri.mockReturnValueOnce(decoratedUri)
      const data = await getData(getMockRequest())

      expect(data.uri.new).toEqual(decoratedUri)
    })
  })

  describe.each([
    ['email', constants.HOW_CONTACTED.email],
    ['text', constants.HOW_CONTACTED.text],
    ['none', constants.HOW_CONTACTED.none],
    ['letter', constants.HOW_CONTACTED.letter]
  ])('valid response - (how contacted=%s)', (name, fn) => {
    beforeEach(async () => {
      const newAuthenticationResult = Object.assign({}, authenticationResult)
      newAuthenticationResult.permission.licensee.preferredMethodOfConfirmation.label = fn
      newAuthenticationResult.permission.endDate = moment().startOf('day').toISOString()
      salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
      salesApi.preparePermissionDataForRenewal.mockImplementation(
        jest.fn(async () => new Promise(resolve => resolve(getPreparedRenewalData(newAuthenticationResult))))
      )
      await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
      await injectWithCookies('GET', IDENTIFY.uri)
    })

    it('returns a 302 status code on a POST request to the identify uri', async () => {
      const data = await injectWithCookies(
        'POST',
        IDENTIFY.uri,
        Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY))
      )

      expect(data.statusCode).toBe(302)
    })

    it('redirects to the authentication uri on a POST request to the identify uri', async () => {
      const data = await injectWithCookies(
        'POST',
        IDENTIFY.uri,
        Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY))
      )

      expect(data).toEqual(
        expect.objectContaining({
          statusCode: 302,
          headers: expect.objectContaining({
            location: expect.toHaveValidPathFor(AUTHENTICATE.uri)
          })
        })
      )
    })

    it('returns a 302 status code on a GET request to the authenticate uri', async () => {
      await injectWithCookies(
        'POST',
        IDENTIFY.uri,
        Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY))
      )
      const data = await injectWithCookies('GET', AUTHENTICATE.uri)

      expect(data.statusCode).toBe(302)
    })

    it('redirects to the controller uri on a GET request to the authenticate uri', async () => {
      await injectWithCookies(
        'POST',
        IDENTIFY.uri,
        Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY))
      )
      const data = await injectWithCookies('GET', AUTHENTICATE.uri)

      expect(data.headers.location).toHaveValidPathFor(CONTROLLER.uri)
    })

    it('redirects on a GET request to the licence summary when cache is not populated', async () => {
      await injectWithCookies(
        'POST',
        IDENTIFY.uri,
        Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY))
      )
      await injectWithCookies('GET', AUTHENTICATE.uri)
      await injectWithCookies('GET', CONTROLLER.uri)
      const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)

      expect(data.statusCode).toBe(302)
    })

    it('redirects on a GET request to the contact summary when cache is not populated', async () => {
      await injectWithCookies(
        'POST',
        IDENTIFY.uri,
        Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY))
      )
      await injectWithCookies('GET', AUTHENTICATE.uri)
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
      const data = await injectWithCookies('GET', CONTACT_SUMMARY.uri)

      expect(data.statusCode).toBe(302)
    })
  })

  const salmonAndSeaTroutPermitSubtype = {
    id: 910400000,
    label: 'Salmon and sea trout',
    description: 'S'
  }

  const troutAndCoarsePermitSubtype = {
    id: 910400001,
    label: 'Trout and coarse',
    description: 'C'
  }

  it.each([
    [
      'Trout and coarse - 2 rod',
      { subType: troutAndCoarsePermitSubtype, numberOfRods: '2', licenceType: constants.LICENCE_TYPE['trout-and-coarse'] }
    ],
    [
      'Trout and coarse - 3 rod',
      { subType: troutAndCoarsePermitSubtype, numberOfRods: '3', licenceType: constants.LICENCE_TYPE['trout-and-coarse'] }
    ],
    [
      'Salmon and sea trout',
      { subType: salmonAndSeaTroutPermitSubtype, numberOfRods: '1', licenceType: constants.LICENCE_TYPE['salmon-and-sea-trout'] }
    ]
  ])('redirects to the controller on posting a valid response - (licence type=%s)', async (name, obj) => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.permit.numberOfRods = obj.numberOfRods
    newAuthenticationResult.permission.permit.permitSubtype = obj.subType
    newAuthenticationResult.permission.endDate = moment().startOf('day').toISOString()
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)

    expect(data).toEqual(
      expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({
          location: expect.toHaveValidPathFor(CONTROLLER.uri)
        })
      })
    )
  })

  it('that an adult licence holder who is now over the senior concession date redirects to the controller', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.endDate = moment().startOf('day').toISOString()
    newAuthenticationResult.permission.licensee.birthDate = moment().add(-66, 'years').add(-1, 'days')
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)

    expect(data).toEqual(
      expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({
          location: expect.toHaveValidPathFor(CONTROLLER.uri)
        })
      })
    )
  })

  it('that an expiry too far in the future causes a redirect to the invalid renewal page', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .add(RENEW_BEFORE_DAYS + 1, 'days')
      .toISOString()
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    salesApi.preparePermissionDataForRenewal.mockImplementation(
      jest.fn(
        async () =>
          new Promise(resolve =>
            resolve({
              ...getPreparedRenewalData(newAuthenticationResult),
              renewedEndDate: newAuthenticationResult.permission.endDate
            })
          )
      )
    )
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    const authResponse = await injectWithCookies('GET', AUTHENTICATE.uri)
    const inactivePageResponse = await injectWithCookies('GET', RENEWAL_INACTIVE.uri)
    const inactivePostResponse = await injectWithCookies('POST', RENEWAL_INACTIVE.uri, {})

    expect({ authResponse, inactivePageResponse, inactivePostResponse }).toEqual({
      authResponse: expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({ location: expect.toHaveValidPathFor(RENEWAL_INACTIVE.uri) })
      }),
      inactivePageResponse: expect.objectContaining({ statusCode: 200 }),
      inactivePostResponse: expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({ location: expect.toHaveValidPathFor(LICENCE_LENGTH.uri) })
      })
    })
  })

  it('that an expiry that has expired causes a redirect to the invalid renewal page', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .add(-1 * (RENEW_AFTER_DAYS + 1), 'days')
      .toISOString()
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    salesApi.preparePermissionDataForRenewal.mockImplementation(
      jest.fn(
        async () =>
          new Promise(resolve =>
            resolve({
              ...getPreparedRenewalData(newAuthenticationResult),
              renewedEndDate: newAuthenticationResult.permission.endDate
            })
          )
      )
    )
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)

    expect(data).toEqual(
      expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({
          location: expect.toHaveValidPathFor(RENEWAL_INACTIVE.uri)
        })
      })
    )
  })

  it('that an expiry for a 1 or 8 day licence causes a redirect to the invalid renewal page', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.permit.durationMagnitude = 1
    newAuthenticationResult.permission.permit.durationDesignator.description = 'D'
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult))))
    salesApi.preparePermissionDataForRenewal.mockImplementation(
      jest.fn(
        async () =>
          new Promise(resolve =>
            resolve({
              ...getPreparedRenewalData(newAuthenticationResult),
              licenceLength: '1D'
            })
          )
      )
    )
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY)))
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)

    expect(data).toEqual(
      expect.objectContaining({
        statusCode: 302,
        headers: expect.objectContaining({
          location: expect.toHaveValidPathFor(RENEWAL_INACTIVE.uri)
        })
      })
    )
  })
})
