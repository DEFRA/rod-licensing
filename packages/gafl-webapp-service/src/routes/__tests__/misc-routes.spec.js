import { start, stop, injectWithCookies, initialize } from '../../__mocks__/test-utils-system.js'
import {
  REFUND_POLICY,
  ACCESSIBILITY_STATEMENT,
  COOKIES,
  PRIVACY_POLICY,
  RENEWAL_PUBLIC,
  IDENTIFY,
  OS_TERMS,
  SET_CURRENT_PERMISSION,
  CHANGE_LICENCE_OPTIONS,
  CONTROLLER
} from '../../uri.js'
import { CHANGE_LICENCE_OPTIONS_SEEN } from '../../constants.js'
import miscRoutes from '../misc-routes.js'
import { createMockRequestToolkit } from '../../__mocks__/request.js'
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
    console.log(data.headers)
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
    console.log('data: ', data.headers)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(addLanguageCodeToUri(mockRequest, IDENTIFY.uri.replace('{referenceNumber}', 'AAAAAA')))
  })

  it('return the OS terms page when requested', async () => {
    const data = await injectWithCookies('GET', OS_TERMS.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects to the licence options page', async () => {
    const data = await injectWithCookies('GET', SET_CURRENT_PERMISSION.uri)
    const mockStatusCacheGet = jest.fn(() => ({}))
    mockStatusCacheGet.mockImplementationOnce(() => ({ fromLicenceOptions: 'seen' }))
    expect(data.statusCode).toBe(302)
  })

  it('redirects to the licence summary page', async () => {
    const data = await injectWithCookies('GET', SET_CURRENT_PERMISSION.uri)
    const mockStatusCacheGet = jest.fn(() => ({}))
    mockStatusCacheGet.mockImplementationOnce(() => ({ fromLicenceOptions: 'not-seen' }))
    expect(data.statusCode).toBe(302)
  })
})

describe('SET_CURRENT_PERMISSION handler', () => {
  jest.mock('../../constants', () => ({
    CHANGE_LICENCE_OPTIONS_SEEN: {
      SEEN: 'seen',
      NOT_SEEN: 'not-seen'
    }
  }))

  const mockStatusCacheGet = jest.fn()
  const mockStatusCacheSet = jest.fn()

  const mockRequest = (query = {}) => ({
    cache: () => ({
      helpers: {
        status: {
          get: mockStatusCacheGet,
          set: mockStatusCacheSet
        }
      }
    }),
    query
  })

  beforeEach(() => jest.clearAllMocks())
  const currentPermissionHandler = miscRoutes.find(r => r.path === SET_CURRENT_PERMISSION.uri).handler
  it.each([
    [5, 5],
    [3, 3],
    ['7', 7],
    ['2', 2]
  ])('sets current permission index', async (permissionIndex, currentPermissionIdx) => {
    const status = {
      [CHANGE_LICENCE_OPTIONS_SEEN.SEEN]: 'seen'
    }
    const query = {
      permissionIndex: permissionIndex
    }

    mockStatusCacheGet.mockImplementationOnce(() => status)

    await currentPermissionHandler(mockRequest(query), createMockRequestToolkit())
    expect(mockStatusCacheSet).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPermissionIdx
      })
    )
  })

  it('redirects to licence options page', async () => {
    const status = {
      fromChangeLicenceOptions: 'seen'
    }

    const query = {
      permissionIndex: '1'
    }

    mockStatusCacheGet.mockImplementationOnce(() => status)

    const mockToolkit = createMockRequestToolkit()

    await currentPermissionHandler(mockRequest(query), mockToolkit)

    expect(mockToolkit.redirect).toHaveBeenCalledWith(CHANGE_LICENCE_OPTIONS.uri)
  })
})
