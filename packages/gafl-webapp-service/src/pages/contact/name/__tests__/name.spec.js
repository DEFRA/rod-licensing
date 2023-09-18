import { NAME, TEST_TRANSACTION, DATE_OF_BIRTH } from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

describe('The name page', () => {
  it('Return success on requesting', async () => {
    const response = await injectWithCookies('GET', NAME.uri)
    expect(response.statusCode).toBe(200)
  })

  it('Redirects back to itself on posting an empty name', async () => {
    const response = await injectWithCookies('POST', NAME.uri, { 'first-name': '', 'last-name': '' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${NAME.uri}#`)
  })

  it('Redirects back to itself on posting a too long first name', async () => {
    const response = await injectWithCookies('POST', NAME.uri, {
      'first-name': 'Harry'.repeat(200),
      'last-name': 'OK'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${NAME.uri}#`)
  })

  it('Redirects back to itself on posting a too long last name', async () => {
    const response = await injectWithCookies('POST', NAME.uri, {
      'last-name': 'Harry'.repeat(200),
      'first-name': 'OK'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${NAME.uri}#`)
  })

  it('Redirects back to itself on posting a too short first name', async () => {
    const response = await injectWithCookies('POST', NAME.uri, {
      'first-name': 'H',
      'last-name': 'OK'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${NAME.uri}#`)
  })

  it('Redirects back to itself on posting a too short last name', async () => {
    const response = await injectWithCookies('POST', NAME.uri, {
      'last-name': 'H',
      'first-name': 'OK'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${NAME.uri}#`)
  })

  it('Redirects back to itself on posting a first name with invalid characters', async () => {
    const response = await injectWithCookies('POST', NAME.uri, {
      'last-name': 'OK',
      'first-name': '%%%%'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${NAME.uri}#`)
  })

  it('Redirects back to itself on posting a last name with invalid characters', async () => {
    const response = await injectWithCookies('POST', NAME.uri, {
      'last-name': '%%%%',
      'first-name': 'OK'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${NAME.uri}#`)
  })

  it('Check character substitutions are made on a successful submission', async () => {
    const response = await injectWithCookies('POST', NAME.uri, {
      'last-name': 'WILLIS',
      'first-name': 'GRAHAM    MICHAEL'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${DATE_OF_BIRTH.uri}#`)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)

    expect(JSON.parse(payload).permissions[0].licensee).toEqual({ firstName: 'Graham Michael', lastName: 'Willis' })
  })
})
