import { LICENCE_START_TIME, CONTROLLER, TEST_TRANSACTION } from '../../../../uri.js'
import { start, stop, initialize, injectWithCookie } from '../../../../__mocks__/test-utils.js'
import each from 'jest-each'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

// Start application before running the test case
describe('The licence start time page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', LICENCE_START_TIME.uri)
    expect(data.statusCode).toBe(200)
  })
  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', LICENCE_START_TIME.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_START_TIME.uri)
  })
  it('redirects back to itself on an invalid time', async () => {
    const data = await injectWithCookie('POST', LICENCE_START_TIME.uri, {
      'licence-start-time': '25'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_START_TIME.uri)
  })
  each([
    ['Midnight', '0'],
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
  ]).it('stores the transaction on successful submission of %s', async (desc, code) => {
    const data = await injectWithCookie('POST', LICENCE_START_TIME.uri, { 'licence-start-time': code })

    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)

    // Hit the controller
    await injectWithCookie('GET', CONTROLLER.uri)

    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)

    expect(JSON.parse(payload).permissions[0].licenceStartTime).toBe(code)
  })
})
