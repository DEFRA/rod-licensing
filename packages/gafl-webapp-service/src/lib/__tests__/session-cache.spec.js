import { start, stop, initialize, injectWithCookie, injectWithoutCookie } from '../../misc/test-utils.js'
import { CONTROLLER, LICENCE_LENGTH, LICENCE_TYPE } from '../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The controller handler', () => {
  it('Clearing the session cookie will redirect to the start of the journey', async () => {
    let data = await injectWithoutCookie('GET', LICENCE_TYPE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookie('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Clearing the session cookie will redirect to the start of the journey on a post valid response', async () => {
    let data = await injectWithoutCookie('POST', LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookie('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Clearing the session cookie will redirect to the start of the journey on a post invalid response', async () => {
    let data = await injectWithoutCookie('POST', LICENCE_TYPE.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookie('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Deleting the session cache will redirect to the start of the journey', async () => {
    await injectWithCookie('GET', '/buy/clear-cache')
    let data = await injectWithCookie('GET', LICENCE_TYPE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    // The first response adds a permission and redirects back
    await injectWithCookie('GET', CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookie('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Deleting the session cache will redirect to the start of the journey on a post valid response', async () => {
    await injectWithCookie('GET', '/buy/clear-cache')
    let data = await injectWithCookie('POST', LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    // The first response adds a permission and redirects back
    await injectWithCookie('GET', CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookie('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Deleting the session cache will redirect to the start of the journey on a post invalid response', async () => {
    await injectWithCookie('GET', LICENCE_TYPE.uri)
    await injectWithCookie('GET', '/buy/clear-cache')
    let data = await injectWithCookie('POST', LICENCE_TYPE.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    // The first request initializes the cache
    await injectWithCookie('GET', CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    // The second request adds a permission and redirects back
    await injectWithCookie('GET', CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    // Then to the start of the journey
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookie('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })
})
