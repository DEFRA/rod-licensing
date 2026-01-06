import {
  LICENCE_START_TIME,
  TEST_TRANSACTION,
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  CONTROLLER,
  LICENCE_SUMMARY,
  LICENCE_TYPE
} from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'

import { ADULT_TODAY, dobHelper, startDateHelper } from '../../../../__mocks__/test-utils-business-rules'
import { licenceToStart } from '../../licence-to-start/update-transaction'
import moment from 'moment'
import { licenseTypes } from '../../licence-type/route'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

afterEach(() => {
  jest.restoreAllMocks()
})

function mockMoment(fixedDate) {
  jest.spyOn(moment, 'now').mockImplementation(() => fixedDate.valueOf())
}

describe('The licence start time page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', LICENCE_START_TIME.uri)
    expect(response.statusCode).toBe(200)
  })
  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', LICENCE_START_TIME.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_START_TIME.uri)
  })
  it('redirects back to itself on an invalid time', async () => {
    const response = await injectWithCookies('POST', LICENCE_START_TIME.uri, {
      'licence-start-time': '25'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_START_TIME.uri)
  })
  it.each([
    ['Start of the day', '0'],
    ['1am', '1'],
    ['2am', '2'],
    ['3am', '3'],
    ['4am', '4'],
    ['5am', '5'],
    ['6am', '6'],
    ['7am', '7'],
    ['8am', '8'],
    ['9am', '9'],
    ['10am', '10'],
    ['11am', '11'],
    ['Midday', '12'],
    ['1pm', '13'],
    ['2pm', '14'],
    ['3pm', '15'],
    ['4pm', '16'],
    ['5pm', '17'],
    ['6pm', '18'],
    ['7pm', '19'],
    ['8pm', '20'],
    ['9pm', '21'],
    ['10pm', '22'],
    ['11pm', '23']
  ])('stores the transaction on successful submission of %s', async (desc, code) => {
    await injectWithCookies('POST', LICENCE_START_TIME.uri, { 'licence-start-time': code })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licenceStartTime).toBe(code)
  })

  it('does not display prior times for same day licence when minHour = 0', async () => {
    mockMoment(new Date('2026-01-05T22:30:00Z')) // This will make minHour = 0

    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment())
    })

    // For minHour = 0, value="0" should be disabled
    const response = await injectWithCookies('GET', LICENCE_START_TIME.uri)
    const disabledFragment = 'name="licence-start-time" type="radio" value="0" disabled>';
    expect(response.payload).toContain(disabledFragment)
  })

  it('does not display prior times for same day licence when minHour > 0', async () => {
    mockMoment(new Date('2026-01-06T13:15:00Z'))

    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment())
    })

    const minHour = moment().add(1, 'hour').add(30, 'minute').startOf('hour').hour()
    const disabledFragment = `name="licence-start-time" type="radio" value="${minHour - 1}" disabled>`
    const enabledFragment = `name="licence-start-time" type="radio" value="${minHour}">`

    const response = await injectWithCookies('GET', LICENCE_START_TIME.uri)
    expect(response.payload).toContain(disabledFragment)
    expect(response.payload).toContain(enabledFragment)
  })

  it('redirects to the summary page if the summary page has been seen', async () => {
    await injectWithCookies('GET', CONTROLLER.uri)
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, {
      'licence-to-start': licenceToStart.ANOTHER_DATE,
      ...startDateHelper(moment().add(1, 'day'))
    })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookies('POST', LICENCE_START_TIME.uri, { 'licence-start-time': '11' })
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    const response = await injectWithCookies('POST', LICENCE_START_TIME.uri, { 'licence-start-time': '12' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_SUMMARY.uri)
  })
})
