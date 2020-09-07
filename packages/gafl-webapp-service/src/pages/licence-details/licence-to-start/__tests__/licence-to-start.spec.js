import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'
import {
  LICENCE_TO_START,
  DATE_OF_BIRTH,
  DISABILITY_CONCESSION,
  NO_LICENCE_REQUIRED,
  LICENCE_LENGTH,
  LICENCE_START_TIME
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

beforeAll(d => start(d))
beforeAll(d => initialize(d))
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
    expect(response.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it('redirects back to itself on posting an invalid date', async () => {
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      'licence-start-date-year': '2020',
      'licence-start-date-month': '11',
      'licence-start-date-day': '35'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it('redirects back to itself on posting a start date in the past', async () => {
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment().add(-1, 'days'))
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it(`redirects back to itself on posting a start date ahead of the maximum forward purchase date: ${DATE_AT_ADVANCED_PURCHASE_MAX_DAYS.format(
    'YYYY-MM-DD'
  )}`, async () => {
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment().add(ADVANCED_PURCHASE_MAX_DAYS + 1, 'days'))
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_TO_START.uri)
  })

  describe(`for a user who is born on the ${juniorIn16Days.format('YYYY-MM-DD')}`, async () => {
    beforeEach(async d => {
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(juniorIn16Days))
      d()
    })

    it(`redirects to the disabled concessions page when posting a licence start date of ${moment()
      .add(16, 'day')
      .format('YYYY-MM-DD')}`, async () => {
      const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
        'licence-to-start': licenceToStart.ANOTHER_DATE,
        ...startDateHelper(moment().add(16, 'day'))
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(DISABILITY_CONCESSION.uri)
    })

    it(`redirects to the no licence required page when posting a licence start date of ${moment()
      .add(15, 'day')
      .format('YYYY-MM-DD')}`, async () => {
      const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
        'licence-to-start': licenceToStart.ANOTHER_DATE,
        ...startDateHelper(moment().add(15, 'day'))
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(NO_LICENCE_REQUIRED.uri)
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
    expect(response.headers.location).toBe(NO_LICENCE_REQUIRED.uri)
  })

  it(`for a user who is born on the ${JUNIOR_TODAY.format(
    'YYYY-MM-DD'
  )} and when posting a licence starting immediately, it redirects to the disabled concessions`, async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.AFTER_PAYMENT
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(DISABILITY_CONCESSION.uri)
  })

  it('redirects to the start-time page if it already known that this is a 1 or 8 day licence', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const response = await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment().add(16, 'day'))
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_START_TIME.uri)
  })
})
