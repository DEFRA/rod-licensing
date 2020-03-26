import { start, stop, initialize, injectWithCookie } from '../../../misc/test-utils.js'
import { LICENCE_TO_START, CONTROLLER } from '../../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe("The 'when would you like you licence to start?' page", () => {
  it('Return success on requesting', async () => {
    const data = await injectWithCookie('GET', LICENCE_TO_START.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', LICENCE_TO_START.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it('redirects back to itself on posting an invalid response', async () => {
    const data = await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'foo' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it("stores the transaction on successful submission of 'after payment'", async () => {
    const data = await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    await injectWithCookie('GET', CONTROLLER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licenceToStart).toBe('after-payment')
  })

  it("stores the transaction on successful submission of 'another date or time'", async () => {
    const data = await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'another-date-or-time' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    await injectWithCookie('GET', CONTROLLER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licenceToStart).toBe('another-date-or-time')
  })
})
