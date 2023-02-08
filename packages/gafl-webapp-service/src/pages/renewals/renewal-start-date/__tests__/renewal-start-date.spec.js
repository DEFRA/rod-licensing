import {
  IDENTIFY,
  AUTHENTICATE,
  CONTROLLER,
  RENEWAL_START_DATE,
  LICENCE_SUMMARY,
  TEST_TRANSACTION
} from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../__mocks__/test-utils-system.js'
import { startDateHelper, dobHelper, ADULT_TODAY } from '../../../../__mocks__/test-utils-business-rules.js'
import { ADVANCED_PURCHASE_MAX_DAYS } from '@defra-fish/business-rules-lib'

import { salesApi } from '@defra-fish/connectors-lib'
import { licenceToStart } from '../../../licence-details/licence-to-start/update-transaction.js'
import { authenticationResult } from '../../identify/__mocks__/data/authentication-result.js'
import moment from 'moment'

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
})
beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_XGOV_PROPERTY
})

const VALID_IDENTIFY = IDENTIFY.uri.replace('{referenceNumber}', 'AAAAAA')
jest.mock('@defra-fish/connectors-lib')
mockSalesApi()

describe('The easy renewal, change start date page', () => {
  describe('where the licence expires tomorrow', () => {
    beforeEach(async () => {
      const newAuthenticationResult = Object.assign({}, authenticationResult)
      newAuthenticationResult.permission.endDate = moment().add(1, 'day').startOf('day').add(6, 'hours').toISOString()
      salesApi.authenticate.mockResolvedValue(newAuthenticationResult)
      await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(ADULT_TODAY)))
      await injectWithCookies('GET', AUTHENTICATE.uri)
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    })
    it('the correct default start date has been applied', async () => {
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().add(1, 'day').format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(6)
      expect(permission.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    })
    it('redirects back to the renewal page when requesting an invalid start date', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      const data = await injectWithCookies('POST', RENEWAL_START_DATE.uri, {
        'licence-start-date-year': '100',
        'licence-start-date-month': '100',
        'licence-start-date-day': '100'
      })
      expect(data.statusCode).toBe(302)
      expect(data.headers.location).toBe(RENEWAL_START_DATE.uri)
    })
    it('cannot start the licence more than 30 days after expiry ', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies(
        'POST',
        RENEWAL_START_DATE.uri,
        startDateHelper(
          moment()
            .add(1, 'day')
            .add(ADVANCED_PURCHASE_MAX_DAYS + 1, 'days')
        )
      )
      const response = await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(RENEWAL_START_DATE.uri)
    })
    it('cannot start the licence today', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment()))
      const response = await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(RENEWAL_START_DATE.uri)
    })
    it('can start the licence 30 days after expiry ', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies(
        'POST',
        RENEWAL_START_DATE.uri,
        startDateHelper(moment().add(1, 'day').add(ADVANCED_PURCHASE_MAX_DAYS, 'days'))
      )
      const response = await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_SUMMARY.uri)
    })
    it('starting the licence tomorrow continues the licence immediately after the expiry date and time', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment().add(1, 'day')))
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().add(1, 'day').format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(6)
      expect(permission.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    })
    it('starting the licence after tomorrow continues starts the licence at midnight', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment().add(2, 'day')))
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().add(2, 'day').format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(0)
      expect(permission.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    })
  })

  describe('where the licence expires later today', () => {
    beforeEach(async () => {
      const newAuthenticationResult = Object.assign({}, authenticationResult)
      newAuthenticationResult.permission.endDate = moment().add(2, 'hours').toISOString()
      salesApi.authenticate.mockResolvedValue(newAuthenticationResult)
      await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(ADULT_TODAY)))
      await injectWithCookies('GET', AUTHENTICATE.uri)
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    })
    it('the correct default start date has been applied', async () => {
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(moment().hours() + 2)
      expect(permission.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    })
    it('cannot start the licence yesterday', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment().add(-1, 'days')))
      const response = await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(RENEWAL_START_DATE.uri)
    })
    it('starting the licence today forces a continuation', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment()))
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(moment().hours() + 2)
      expect(permission.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    })
    it('starting the licence tomorrow starts at midnight', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment().add(1, 'day')))
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().add(1, 'day').format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(0)
      expect(permission.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    })
  })

  describe('where the the licence expired earlier today', () => {
    const PREFERRED_HOUR = 15
    beforeEach(async () => {
      const newAuthenticationResult = Object.assign({}, authenticationResult)
      newAuthenticationResult.permission.endDate = moment()
        .set(PREFERRED_HOUR - 2, 'hour') // set time to 13:00 today
        .toISOString()
      salesApi.authenticate.mockResolvedValue(newAuthenticationResult)
      await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(ADULT_TODAY)))
      await injectWithCookies('GET', AUTHENTICATE.uri)
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    })
    it('the correct default start date has been applied', async () => {
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(0)
      expect(permission.licenceToStart).toBe(licenceToStart.AFTER_PAYMENT)
    })
    it('starting the licence today will set after payment', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment().set(PREFERRED_HOUR, 'hour'))) // set time to 15:00 today
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).not.toBeTruthy()
      expect(permission.licenceToStart).toBe(licenceToStart.AFTER_PAYMENT)
    })
    it('starting the licence tomorrow will start at the beginning of the day', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment().set(PREFERRED_HOUR, 'hour').add(1, 'day'))) // set time to 15:00 tomorrow
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().add(1, 'day').format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(0)
      expect(permission.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    })
  })
  describe('where the the licence expired yesterday', () => {
    beforeEach(async () => {
      const newAuthenticationResult = Object.assign({}, authenticationResult)
      newAuthenticationResult.permission.endDate = moment().add(-1, 'day').toISOString()
      salesApi.authenticate.mockResolvedValue(newAuthenticationResult)
      await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(ADULT_TODAY)))
      await injectWithCookies('GET', AUTHENTICATE.uri)
      await injectWithCookies('GET', CONTROLLER.uri)
      await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    })
    it('the correct default start date has been applied', async () => {
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(0)
      expect(permission.licenceToStart).toBe(licenceToStart.AFTER_PAYMENT)
    })
    it('cannot start the licence more than 30 days hence', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment().add(ADVANCED_PURCHASE_MAX_DAYS + 1, 'days')))
      const response = await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(RENEWAL_START_DATE.uri)
    })
    it('starting the licence tomorrow will start at the beginning of the day', async () => {
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      await injectWithCookies('POST', RENEWAL_START_DATE.uri, startDateHelper(moment().add(1, 'day')))
      await injectWithCookies('GET', RENEWAL_START_DATE.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const permission = JSON.parse(payload).permissions[0]
      expect(permission.licenceStartDate).toBe(moment().add(1, 'day').format('YYYY-MM-DD'))
      expect(permission.licenceStartTime).toBe(0)
      expect(permission.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    })
  })
})
