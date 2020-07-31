import { LICENCE_START_TIME, CONTROLLER, TEST_TRANSACTION } from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The licence start time page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', LICENCE_START_TIME.uri)
    expect(response.statusCode).toBe(200)
  })
  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', LICENCE_START_TIME.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_START_TIME.uri)
  })
  it('redirects back to itself on an invalid time', async () => {
    const response = await injectWithCookies('POST', LICENCE_START_TIME.uri, {
      'licence-start-time': '25'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_START_TIME.uri)
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
    await postRedirectGet(LICENCE_START_TIME.uri, { 'licence-start-time': code })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licenceStartTime).toBe(code)
  })
})
