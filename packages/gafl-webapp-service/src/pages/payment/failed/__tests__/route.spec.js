import { NEW_TRANSACTION } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { isRecurringPayment } from '../../../../processors/recurring-pay-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS } from '../../../../constants.js'
import { GOVUK_PAY_ERROR_STATUS_CODES } from '@defra-fish/business-rules-lib'

beforeEach(jest.clearAllMocks)
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../processors/recurring-pay-helper.js')

const getMockTransaction = agreementId => ({
  agreementId
})

const getMockRequest = ({ code, transaction = getMockTransaction() } = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        get: () => ({
          [COMPLETION_STATUS.paymentFailed]: true,
          payment: {
            code: code
          }
        })
      },
      transaction: {
        get: async () => transaction
      }
    }
  })
})

describe('getData', () => {
  it('addLanguageCodeToUri is called with the expected arguments', async () => {
    const request = getMockRequest()
    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, NEW_TRANSACTION.uri)
  })

  it('returns correct URI', async () => {
    const expectedUri = Symbol('decorated uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

    const result = await getData(getMockRequest())
    expect(result.uri.new).toEqual(expectedUri)
  })

  it.each(['738483', '123454', '2983923'])('returns correct failure code', async failureCode => {
    const result = await getData(getMockRequest({ code: failureCode }))
    expect(result['failure-code']).toEqual(failureCode)
  })

  it('returns GOVUK codes', async () => {
    const result = await getData(getMockRequest())
    expect(result.codes).toEqual(GOVUK_PAY_ERROR_STATUS_CODES)
  })

  it('passes transaction to isRecurringPayment', async () => {
    const transaction = getMockTransaction(Symbol('agreement'))
    const request = getMockRequest({ transaction })
    await getData(request)
    expect(isRecurringPayment).toHaveBeenCalledWith(transaction)
  })

  it('uses isRecurringPayment to generate recurringPayment', async () => {
    const expectedValue = Symbol('yep!')
    isRecurringPayment.mockReturnValueOnce(expectedValue)
    const { recurringPayment } = await getData(getMockRequest())
    expect(recurringPayment).toBe(expectedValue)
  })
})
