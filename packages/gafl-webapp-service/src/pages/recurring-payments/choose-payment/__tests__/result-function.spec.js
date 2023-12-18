import resultFunction from '../result-function.js'
import { CommonResults } from '../../../../constants.js'

jest.mock('../../../../constants.js', () => ({
  CommonResults: {
    OK: 'ok',
    RECURRING: 'recurring'
  }
}))

describe('choose payment > result function', () => {
  const getMockRequest = (pagePermission = {}) => ({
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: () => pagePermission
        }
      }
    })
  })

  it('returns common result ok when payment is not going to be recurring', async () => {
    const mockRequest = getMockRequest({ payload: { 'recurring-payment': 'no' } })

    const result = await resultFunction(mockRequest)

    expect(result).toBe(CommonResults.OK)
  })

  it('returns common result as recurring when payment is recurring payment', async () => {
    const mockRequest = getMockRequest({ payload: { 'recurring-payment': 'yes' } })

    const result = await resultFunction(mockRequest)

    expect(result).toBe(CommonResults.RECURRING)
  })
})
