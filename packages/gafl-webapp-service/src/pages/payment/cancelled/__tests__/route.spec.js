import { NEW_TRANSACTION } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { isRecurringPayment } from '../../../../processors/recurring-pay-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS } from '../../../../constants.js'

beforeEach(jest.clearAllMocks)
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../processors/recurring-pay-helper.js')

const getMockTransaction = agreementId => ({
  agreementId
})

const getMockRequest = ({ transaction = getMockTransaction() } = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        get: () => ({
          [COMPLETION_STATUS.paymentCreated]: true
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

  it('getData returns correct URI', async () => {
    const expectedUri = Symbol('decorated uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

    const result = await getData(getMockRequest())
    expect(result.uri.new).toEqual(expectedUri)
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
