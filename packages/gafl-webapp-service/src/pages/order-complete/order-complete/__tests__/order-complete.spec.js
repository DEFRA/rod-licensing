import { salesApi } from '@defra-fish/connectors-lib'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'
import { initialize, injectWithCookies, start, stop, mockSalesApi } from '../../../../__mocks__/test-utils-system'
import { JUNIOR_LICENCE } from '../../../../__mocks__/mock-journeys.js'
import {
  AGREED,
  ORDER_COMPLETE,
  TERMS_AND_CONDITIONS,
  LICENCE_DETAILS,
  COOKIES,
  ACCESSIBILITY_STATEMENT,
  PRIVACY_POLICY,
  REFUND_POLICY,
  NEW_TRANSACTION
} from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS } from '../../../../constants.js'

beforeEach(jest.clearAllMocks)
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn((request, uri) => uri || request.path)
}))

const mockRequest = (statusGet = () => {}, transactionGet = () => {}) => ({
  cache: () => ({
    helpers: {
      status: {
        get: statusGet,
        setCurrentPermission: async () => ({
          referenceNumber: 'abc-123'
        }),
        set: async () => ({
          referenceNumber: 'abc-123'
        })
      },
      transaction: {
        getCurrentPermission: transactionGet
      }
    }
  }),
  url: {
    search: ''
  },
  i18n: {
    getCatalog: () => 'messages'
  }
})

jest.mock('@defra-fish/connectors-lib')
mockSalesApi()

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
})
beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_XGOV_PROPERTY
})

describe('The order completion handler', () => {
  it('throws a status 403 (forbidden) exception if the agreed flag is not set', async () => {
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })

  it('throws a status 403 (forbidden) exception if the posted flag is not set', async () => {
    await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })

  it('throw a status 403 (forbidden) exception if the finalized flag is not set', async () => {
    await JUNIOR_LICENCE.setup()
    salesApi.createTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockRejectedValue(new Error())

    await injectWithCookies('GET', AGREED.uri)
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(403)
  })

  it('responds with the order completed page if the journey has finished', async () => {
    addLanguageCodeToUri.mockReturnValue('/buy/order-complete')
    await JUNIOR_LICENCE.setup()
    salesApi.createTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)

    const data1 = await injectWithCookies('GET', AGREED.uri)
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(ORDER_COMPLETE.uri)
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    expect(data.statusCode).toBe(200)
  })

  it('sets the currentPage to order-complete in the cache', async () => {
    await JUNIOR_LICENCE.setup()
    salesApi.createTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)

    await injectWithCookies('GET', AGREED.uri)
    const data = await injectWithCookies('GET', ORDER_COMPLETE.uri)
    const permission = await data.request.cache().helpers.status.getCurrentPermission()
    expect(permission.currentPage).toBe(ORDER_COMPLETE.page)
  })

  it('responds with the licence information page when requested', async () => {
    await JUNIOR_LICENCE.setup()
    salesApi.createTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)

    await injectWithCookies('GET', AGREED.uri)
    await injectWithCookies('GET', ORDER_COMPLETE.uri)
    const data = await injectWithCookies('GET', LICENCE_DETAILS.uri)
    expect(data.statusCode).toBe(200)
  })

  it.each([
    [COOKIES.page, COOKIES.uri],
    [ACCESSIBILITY_STATEMENT.page, ACCESSIBILITY_STATEMENT.uri],
    [PRIVACY_POLICY.page, PRIVACY_POLICY.uri],
    [REFUND_POLICY.page, REFUND_POLICY.uri]
  ])('succesfully navigates to %s when on the order complete page', async (page, uri) => {
    await JUNIOR_LICENCE.setup()
    salesApi.createTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)
    salesApi.finaliseTransaction.mockResolvedValue(JUNIOR_LICENCE.transactionResponse)

    await injectWithCookies('GET', AGREED.uri)
    await injectWithCookies('GET', ORDER_COMPLETE.uri)

    const data = await injectWithCookies('GET', uri)
    expect(data.statusCode).toBe(200)
  })

  it.each([[LICENCE_DETAILS.uri], [NEW_TRANSACTION.uri]])('addLanguageCodeToUri is called with request and %s', async uri => {
    const status = () => ({
      [COMPLETION_STATUS.agreed]: true,
      [COMPLETION_STATUS.posted]: true,
      [COMPLETION_STATUS.finalised]: true
    })
    const transaction = () => ({
      startDate: '2019-12-14T00:00:00Z',
      licensee: {
        postalFulfilment: 'test',
        preferredMethodOfConfirmation: 'test'
      }
    })

    const request = mockRequest(status, transaction)

    displayStartTime.mockReturnValueOnce('1:00am on 6 June 2020')

    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, uri)
  })

  it('addLanguageCodeToUri outputs correct value for new', async () => {
    const status = () => ({
      [COMPLETION_STATUS.agreed]: true,
      [COMPLETION_STATUS.posted]: true,
      [COMPLETION_STATUS.finalised]: true
    })
    const transaction = () => ({
      startDate: '2019-12-14T00:00:00Z',
      licensee: {
        postalFulfilment: 'test',
        preferredMethodOfConfirmation: 'test'
      }
    })

    const decoratedUri = Symbol('order complete uri')
    addLanguageCodeToUri.mockReturnValueOnce(decoratedUri)

    displayStartTime.mockReturnValueOnce('1:00am on 6 June 2020')
    const request = mockRequest(status, transaction)

    const data = await getData(request)
    expect(data.uri.new).toEqual(decoratedUri)
  })

  it('addLanguageCodeToUri outputs correct value for licence details', async () => {
    const status = () => ({
      [COMPLETION_STATUS.agreed]: true,
      [COMPLETION_STATUS.posted]: true,
      [COMPLETION_STATUS.finalised]: true
    })
    const transaction = () => ({
      startDate: '2019-12-14T00:00:00Z',
      licensee: {
        postalFulfilment: 'test',
        preferredMethodOfConfirmation: 'test'
      }
    })

    const decoratedUri = Symbol('licence details uri')
    addLanguageCodeToUri.mockReturnValue(decoratedUri)

    displayStartTime.mockReturnValueOnce('1:00am on 6 June 2020')
    const request = mockRequest(status, transaction)

    const data = await getData(request)
    expect(data.uri.licenceDetails).toEqual(decoratedUri)
  })
})
