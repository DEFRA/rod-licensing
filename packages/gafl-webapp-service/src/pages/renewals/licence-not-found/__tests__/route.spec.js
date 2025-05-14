import {
  IDENTIFY,
  AUTHENTICATE,
  RENEWAL_PUBLIC,
  LICENCE_NOT_FOUND
} from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'
import { dobHelper, ADULT_TODAY } from '../../../../__mocks__/test-utils-business-rules.js'
import { salesApi } from '@defra-fish/connectors-lib'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

const VALID_RENEWAL_PUBLIC_URI = RENEWAL_PUBLIC.uri.replace('{referenceNumber?}', '')

jest.mock('@defra-fish/connectors-lib')

describe('LICENCE_NOT_FOUND route', () => {
  it('redirects to licence not found on posting valid but not authenticated details', async () => {
    salesApi.authenticate.mockImplementation(jest.fn(async () => new Promise(resolve => resolve(null))))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC_URI)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies(
      'POST',
      IDENTIFY.uri,
      Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(ADULT_TODAY))
    )
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toHaveValidPathFor(AUTHENTICATE.uri)
    const data2 = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toHaveValidPathFor(LICENCE_NOT_FOUND.uri)
    const data3 = await injectWithCookies('GET', LICENCE_NOT_FOUND.uri)
    expect(data3.statusCode).toBe(200)
  })
})
