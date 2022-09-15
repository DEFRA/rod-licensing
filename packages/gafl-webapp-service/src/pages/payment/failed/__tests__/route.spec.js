import { NEW_TRANSACTION } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS } from '../../../../constants.js'
import { GOVUK_PAY_ERROR_STATUS_CODES } from '@defra-fish/business-rules-lib'

beforeEach(jest.clearAllMocks)
jest.mock('../../../../processors/uri-helper.js')

const mockStatusCacheGet = jest.fn()

const mockRequest = {
  cache: () => ({
    helpers: {
      status: {
        get: mockStatusCacheGet
      }
    }
  })
}

describe('getData', () => {
  it('addLanguageCodeToUri is called with the expected arguments', async () => {
    mockStatusCacheGet.mockImplementationOnce(() => ({
      [COMPLETION_STATUS.paymentFailed]: true,
      payment: { code: 'code' }
    }))

    await getData(mockRequest)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, NEW_TRANSACTION.uri)
  })

  it('returns correct URI', async () => {
    mockStatusCacheGet.mockImplementationOnce(() => ({
      [COMPLETION_STATUS.paymentFailed]: true,
      payment: { code: 'code' }
    }))

    const expectedUri = Symbol('decorated uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

    const result = await getData(mockRequest)
    expect(result.uri.new).toEqual(expectedUri)
  })

  it.each(['738483', '123454', '2983923'])('returns correct failure code', async failureCode => {
    mockStatusCacheGet.mockImplementationOnce(() => ({
      [COMPLETION_STATUS.paymentFailed]: true,
      payment: { code: failureCode }
    }))

    const result = await getData(mockRequest)
    expect(result['failure-code']).toEqual(failureCode)
  })

  it('returns GOVUK codes', async () => {
    mockStatusCacheGet.mockImplementationOnce(() => ({
      [COMPLETION_STATUS.paymentFailed]: true,
      payment: { code: 'code' }
    }))

    const result = await getData(mockRequest)
    expect(result.codes).toEqual(GOVUK_PAY_ERROR_STATUS_CODES)
  })
  // codes: GOVUK_PAY_ERROR_STATUS_CODES,
})
