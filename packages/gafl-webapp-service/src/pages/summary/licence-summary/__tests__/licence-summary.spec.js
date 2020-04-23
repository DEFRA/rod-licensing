import mockPermits from '../../../../services/sales-api/__mocks__/data/permits.js'
import mockPermitsConcessions from '../../../../services/sales-api/__mocks__/data/permit-concessions.js'
import mockConcessions from '../../../../services/sales-api/__mocks__/data/concessions.js'

import { start, stop, initialize, injectWithCookie, postRedirectGet } from '../../../../__mocks__/test-utils.js'

import {
  LICENCE_SUMMARY,
  CONTROLLER,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  NUMBER_OF_RODS,
  LICENCE_TO_START,
  BENEFIT_CHECK,
  BENEFIT_NI_NUMBER,
  BLUE_BADGE_CHECK,
  BLUE_BADGE_NUMBER,
  LICENCE_START_DATE,
  LICENCE_START_TIME,
  NAME
} from '../../../../constants.js'
import moment from 'moment'

jest.mock('node-fetch')
const fetch = require('node-fetch')

const doMockPermits = () =>
  fetch
    .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits })))
    .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions })))
    .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions })))

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The licence summary page', () => {
  it('redirects to the licence length page if length is set', async () => {
    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('redirects to the licence type page if no licence type is set', async () => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    // await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    // await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TYPE.uri)
  })

  it('redirects to the licence type page if the number of rods is not set', async () => {
    await injectWithCookie('POST', LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse' })
    await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TYPE.uri)
  })

  it('redirects to the licence start date if it is not set', async () => {
    await injectWithCookie('POST', NUMBER_OF_RODS.uri, { 'number-of-rods': '2' })
    await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it('responds with summary page if all necessary pages have been completed', async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)

    // Mock the response from the API
    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('continue causes a redirect to the name page', async () => {
    const data = await postRedirectGet(LICENCE_SUMMARY.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('licence length amendment causes a redirect to the summary page', async () => {
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '8D' })
    await injectWithCookie('GET', CONTROLLER.uri)

    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('licence type amendments cause an eventual redirect back to the summary page', async () => {
    await injectWithCookie('POST', LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await injectWithCookie('GET', CONTROLLER.uri)

    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)

    const data2 = await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse' })

    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(NUMBER_OF_RODS.uri)

    const data3 = await postRedirectGet(NUMBER_OF_RODS.uri, { 'number-of-rods': '2' })
    expect(data3.statusCode).toBe(302)
    expect(data3.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('concession (NI) amendments cause a redirect to the summary page', async () => {
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', BENEFIT_CHECK.uri, { 'benefit-check': 'yes' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', BENEFIT_NI_NUMBER.uri, { 'ni-number': '1234' })
    await injectWithCookie('GET', CONTROLLER.uri)

    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('concession (blue-badge) amendments cause a redirect to the summary page', async () => {
    await injectWithCookie('POST', BENEFIT_CHECK.uri, { 'benefit-check': 'no' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'yes' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', BLUE_BADGE_NUMBER.uri, { 'blue-badge-number': '1234' })
    await injectWithCookie('GET', CONTROLLER.uri)

    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('concession (blue-badge) removal cause a redirect to the summary page', async () => {
    await injectWithCookie('POST', BENEFIT_CHECK.uri, { 'benefit-check': 'no' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'no' })
    await injectWithCookie('GET', CONTROLLER.uri)

    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('number of rod amendments cause a redirect to the summary page', async () => {
    await injectWithCookie('POST', NUMBER_OF_RODS.uri, { 'number-of-rods': '2' })
    await injectWithCookie('GET', CONTROLLER.uri)

    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('unsetting the start date causes a redirect back to the summary page', async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)

    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('changing the start date causes a redirect back to the summary page', async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'another-date-or-time' })
    const fdate = moment().add(5, 'days')
    const body = {
      'licence-start-date-year': fdate.year().toString(),
      'licence-start-date-month': (fdate.month() + 1).toString(),
      'licence-start-date-day': fdate.date().toString()
    }
    await injectWithCookie('POST', LICENCE_START_DATE.uri, body)
    await injectWithCookie('GET', CONTROLLER.uri)

    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('changing the start time causes an eventual redirect back to the summary page', async () => {
    await injectWithCookie('POST', BENEFIT_CHECK.uri, { 'benefit-check': 'no' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'no' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookie('GET', CONTROLLER.uri)

    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'another-date-or-time' })
    const fdate = moment().add(5, 'days')
    const body = {
      'licence-start-date-year': fdate.year().toString(),
      'licence-start-date-month': (fdate.month() + 1).toString(),
      'licence-start-date-day': fdate.date().toString()
    }
    await injectWithCookie('POST', LICENCE_START_DATE.uri, body)
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', LICENCE_START_TIME.uri, { 'licence-start-time': '14' })
    await injectWithCookie('GET', CONTROLLER.uri)

    doMockPermits()

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })
})
