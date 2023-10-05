import { start, stop, initialize, injectWithCookies } from '../../__mocks__/test-utils-system.js'
import { CONTROLLER, LICENCE_FOR, ADD_PERMISSION, NEW_TRANSACTION } from '../../uri.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

describe('The controller handler', () => {
  it('If there is no transaction then initialize redirect to the controller', async () => {
    const data = await injectWithCookies('GET', '/')
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })

  it('Adding a new transaction returns a redirect to the start of the journey', async () => {
    const data = await injectWithCookies('GET', NEW_TRANSACTION.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })

  it('Adding a new permission returns a redirect to the controller', async () => {
    const data = await injectWithCookies('GET', ADD_PERMISSION.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })

  it('The controller returns a redirect to the start of the journey', async () => {
    const data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toHaveValidPathFor(LICENCE_FOR.uri)
  })
})
