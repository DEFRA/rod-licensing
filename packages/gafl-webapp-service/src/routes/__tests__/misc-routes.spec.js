import { start, stop, injectWithCookies, initialize } from '../../__mocks__/test-utils-system.js'
import { REFUND_POLICY, ACCESSIBILITY_STATEMENT, COOKIES, PRIVACY_POLICY, RENEWAL_PUBLIC, IDENTIFY, CONTROLLER } from '../../uri.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'

jest.mock('../../processors/uri-helper.js')

const mockTransactionCacheGet = jest.fn(() => ({
  licenceStartDate: '2021-07-01',
  numberOfRods: '3',
  licenceType: 'Salmon and sea trout',
  licenceLength: '12M',
  licensee: {
    firstName: 'Graham',
    lastName: 'Willis',
    birthDate: '1946-01-01'
  },
  permit: {
    cost: 6
  }
}))

const mockRequest = {
  cache: () => ({
    helpers: {
      transaction: {
        getCurrentPermission: mockTransactionCacheGet
      }
    }
  })
}

// Start application before running the test case
beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The miscellaneous route handlers', () => {
  it('redirect to the main controller when / is requested', async () => {
    const data = await injectWithCookies('GET', '/')
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(addLanguageCodeToUri(mockRequest, CONTROLLER.uri))
  })

  it('return the refund policy page when requested', async () => {
    const data = await injectWithCookies('GET', REFUND_POLICY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the privacy policy page when requested', async () => {
    const data = await injectWithCookies('GET', PRIVACY_POLICY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the accessibility statement page when requested', async () => {
    const data = await injectWithCookies('GET', ACCESSIBILITY_STATEMENT.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the cookie page when requested', async () => {
    const data = await injectWithCookies('GET', COOKIES.uri)
    expect(data.statusCode).toBe(200)
  })

  it('The easy renewals shortcut route redirects correctly', async () => {
    const data = await injectWithCookies('GET', RENEWAL_PUBLIC.uri.replace('{referenceNumber}', 'AAAAAA'))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri.replace('{referenceNumber}', 'AAAAAA'))
  })
})
