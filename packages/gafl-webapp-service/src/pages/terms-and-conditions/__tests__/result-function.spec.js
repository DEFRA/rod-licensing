import resultFunction from '../result-function.js'
import { CommonResults } from '../../../constants.js'
import { validForRecurringPayment } from '../../../processors/recurring-pay-helper.js'

jest.mock('../../../processors/recurring-pay-helper.js')

jest.mock('../../../constants', () => ({
  CommonResults: {
    RECURRING: 'RECURRING',
    OK: 'ok'
  }
}))

const getMockRequest = permission => ({
  cache: () => ({
    helpers: {
      transaction: {
        getCurrentPermission: async () => permission
      }
    }
  })
})

describe('Result function', () => {
  it('validForRecurringPayment is called with a permission', async () => {
    const permission = Symbol('permission')
    const mockRequest = getMockRequest(permission)

    await resultFunction(mockRequest)

    expect(validForRecurringPayment).toHaveBeenCalledWith(permission)
  })

  it.each([
    [CommonResults.OK, false],
    [CommonResults.RECURRING, true]
  ])('should return %s if validForRecurringPayment is %s', async (common, valid) => {
    validForRecurringPayment.mockReturnValueOnce(valid)
    const mockRequest = getMockRequest('permission')

    const result = await resultFunction(mockRequest)

    expect(result).toBe(common)
  })
})
