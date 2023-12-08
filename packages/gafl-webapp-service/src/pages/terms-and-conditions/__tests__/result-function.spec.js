import resultFunction from '../result-function.js'
import { CommonResults } from '../../../constants.js'

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
  it('should return RECURRING when SHOW_RECURRING_PAYMENTS is true and licenceLength is 12M', async () => {
    process.env.SHOW_RECURRING_PAYMENTS = 'true'
    const permission = {
      licenceLength: '12M'
    }
    const mockRequest = getMockRequest(permission)

    const result = await resultFunction(mockRequest)
    expect(result).toBe(CommonResults.RECURRING)
  })

  it('should return OK when SHOW_RECURRING_PAYMENTS is false', async () => {
    process.env.SHOW_RECURRING_PAYMENTS = 'false'
    const permission = {
      licenceLength: '12M'
    }
    const mockRequest = getMockRequest(permission)

    const result = await resultFunction(mockRequest)
    expect(result).toBe(CommonResults.OK)
  })

  it('should return OK when licenceLength is not 12M', async () => {
    process.env.SHOW_RECURRING_PAYMENTS = 'true'
    const permission = {
      licenceLength: '8D'
    }
    const mockRequest = getMockRequest(permission)

    const result = await resultFunction(mockRequest)
    expect(result).toBe(CommonResults.OK)
  })
})
