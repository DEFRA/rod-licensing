import mockPermits from '../../../../services/sales-api/__mocks__/data/permits.js'
import mockPermitsConcessions from '../../../../services/sales-api/__mocks__/data/permit-concessions.js'
import mockConcessions from '../../../../services/sales-api/__mocks__/data/concessions.js'

import { start, stop, initialize, injectWithCookie } from '../../../../__mocks__/test-utils.js'

import {
  LICENCE_SUMMARY,
  CONTROLLER,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  NUMBER_OF_RODS,
  LICENCE_TO_START,
  BENEFIT_CHECK,
  BENEFIT_NI_NUMBER,
  BLUE_BADGE_CHECK
} from '../../../../constants.js'

jest.mock('node-fetch')
const fetch = require('node-fetch')

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
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookie('GET', CONTROLLER.uri)
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
    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions })))

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('concession (NI) amendments cause a redirect to the summary page', async () => {
    await injectWithCookie('POST', BENEFIT_CHECK.uri, { 'benefit-check': 'yes' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', BENEFIT_NI_NUMBER.uri, { 'ni-number': '1234' })
    await injectWithCookie('GET', CONTROLLER.uri)

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions })))

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('concession (blue-badge) amendments cause a redirect to the summary page', async () => {
    await injectWithCookie('POST', BENEFIT_CHECK.uri, { 'benefit-check': 'no' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'yes' })
    await injectWithCookie('GET', CONTROLLER.uri)

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions })))

    const data = await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })
})
