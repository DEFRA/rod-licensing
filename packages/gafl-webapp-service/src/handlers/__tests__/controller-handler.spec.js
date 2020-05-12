import { start, stop, initialize, injectWithCookie } from '../../__mocks__/test-utils.js'
import { CONTROLLER, LICENCE_LENGTH, ADD_PERMISSION, NEW_TRANSACTION } from '../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The controller handler', () => {
  it('If there is no transaction then initialize redirect to the controller', async () => {
    const data = await injectWithCookie('GET', '/')
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
  })

  it('Adding a new transaction returns a redirect to the start of the journey', async () => {
    const data = await injectWithCookie('GET', NEW_TRANSACTION.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
  })

  it('Adding a new permission returns a redirect to the controller', async () => {
    const data = await injectWithCookie('GET', ADD_PERMISSION.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
  })

  it('The controller returns a redirect to the start of the journey', async () => {
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
  })
})
