import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../__mocks__/test-utils-system.js'
import {
  LICENCE_TO_START,
  DATE_OF_BIRTH,
  LICENCE_TYPE,
  NO_LICENCE_REQUIRED,
  LICENCE_LENGTH,
  LICENCE_START_TIME,
  TEST_TRANSACTION
} from '../../../../uri.js'
import { ADVANCED_PURCHASE_MAX_DAYS, MINOR_MAX_AGE } from '@defra-fish/business-rules-lib'
import {
  DATE_AT_ADVANCED_PURCHASE_MAX_DAYS,
  startDateHelper,
  dobHelper,
  JUNIOR_TODAY,
  JUNIOR_TOMORROW,
  ADULT_TODAY
} from '../../../../__mocks__/test-utils-business-rules.js'
import { licenceToStart } from '../update-transaction.js'
import moment from 'moment'

mockSalesApi()

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

const juniorIn16Days = moment()
  .add(16, 'day')
  .add(-MINOR_MAX_AGE - 1, 'year')

describe("The 'when would you like you licence to start?' page", () => {
  it('Return success on requesting', async () => {
    const response = await injectWithCookies('GET', LICENCE_TO_START.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_TO_START.uri)
  })

  it('redirects back to itself on posting an invalid date', async () => {
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      'licence-start-date-year': '2020',
      'licence-start-date-month': '11',
      'licence-start-date-day': '35'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_TO_START.uri)
  })

  it('redirects back to itself on posting a start date in the past', async () => {
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment().add(-1, 'days'))
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_TO_START.uri)
  })

  it(`redirects back to itself on posting a start date ahead of the maximum forward purchase date: ${DATE_AT_ADVANCED_PURCHASE_MAX_DAYS.format(
    'YYYY-MM-DD'
  )}`, async () => {
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment().add(ADVANCED_PURCHASE_MAX_DAYS + 1, 'days'))
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_TO_START.uri)
  })

  describe(`for a user who is born on the ${juniorIn16Days.format('YYYY-MM-DD')}`, () => {
    beforeEach(async () => {
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(juniorIn16Days))
    })

    it(`redirects to the licence type page when posting a licence start date of ${moment()
      .add(16, 'day')
      .format('YYYY-MM-DD')}`, async () => {
      const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
        'licence-to-start': licenceToStart.ANOTHER_DATE,
        ...startDateHelper(moment().add(16, 'day'))
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(LICENCE_TYPE.uri)
    })

    it(`redirects to the no licence required page when posting a licence start date of ${moment()
      .add(15, 'day')
      .format('YYYY-MM-DD')}`, async () => {
      const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
        'licence-to-start': licenceToStart.ANOTHER_DATE,
        ...startDateHelper(moment().add(15, 'day'))
      })
      expect(response.statusCode).toBe(302)
      console.log('response.headers.location', response.headers.location, NO_LICENCE_REQUIRED.uri)
      expect(response.headers.location).toHaveValidPathFor(NO_LICENCE_REQUIRED.uri)
    })
  })

  it(`for a user who is born on the ${JUNIOR_TOMORROW.format(
    'YYYY-MM-DD'
  )} and when posting a licence starting immediately, it redirects to the no licence required page`, async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TOMORROW))
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.AFTER_PAYMENT
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(NO_LICENCE_REQUIRED.uri)
  })

  it(`for a user who is born on the ${JUNIOR_TODAY.format(
    'YYYY-MM-DD'
  )} and when posting a licence starting immediately, it redirects to the licence type`, async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.AFTER_PAYMENT
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_TYPE.uri)
  })

  it('redirects to the start-time page if it already known that this is a 1 or 8 day licence', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment().add(16, 'day'))
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_START_TIME.uri)
  })

  it('changing from a 12 month to a one day licence removes the start time', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment().add(16, 'day'))
    })
    await injectWithCookies('POST', LICENCE_START_TIME.uri, { 'licence-start-time': 11 })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    const permission = JSON.parse(payload).permissions[0]
    expect(permission.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    expect(permission.licenceStartTime).toBe('11')
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    const { payload: payload2 } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    const permission2 = JSON.parse(payload2).permissions[0]
    expect(permission2.licenceToStart).toBe(licenceToStart.ANOTHER_DATE)
    expect(permission2.licenceStartTime).toBeFalsy()
  })

  it("changing from a 12 month to a one day licence, starting today, removes the start time and sets 'after-payment'", async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment())
    })
    await injectWithCookies('POST', LICENCE_START_TIME.uri, { 'licence-start-time': 23 })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    const permission = JSON.parse(payload).permissions[0]
    expect(permission.licenceToStart).toBe(licenceToStart.AFTER_PAYMENT)
    expect(permission.licenceStartTime).toBeFalsy()
  })

  it('Ensure date limits are calculated each time the validator runs', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    jest.isolateModules(async () => {
      try {
        jest.mock('moment')
        const moment = require('moment')
        moment.mockImplementation(() => {
          return jest.requireActual('moment')().add(46, 'day')
        })
        const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
          'licence-to-start': licenceToStart.ANOTHER_DATE,
          ...startDateHelper(moment().add(48, 'day'))
        })
        expect(response.statusCode).toBe(302)
        expect(response.headers.location).toHaveValidPathFor(LICENCE_START_TIME.uri)
        jest.restoreAllMocks()
      } catch (e) {
        console.error(e)
      }
    })
  })
})
