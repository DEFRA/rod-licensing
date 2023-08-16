import { CommonResults } from '../../../../constants.js'
import resultFunction, { licenceLengthResults } from '../result-function'
import CommonResultHandler from '../../../../handlers/multibuy-amend-handler.js'

jest.mock('../../../../handlers/multibuy-amend-handler.js', () => jest.fn(() => {}))

describe('result-function', () => {
  const getMockRequest = transactionPermission => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: async () => transactionPermission
        }
      }
    })
  })

  it('should return the value of common result handler', async () => {
    const commonResult = Symbol('Common Result')
    CommonResultHandler.mockReturnValue(commonResult)
    const request = getMockRequest({ licenceToStart: false, licenceLength: '1D' })
    const result = await resultFunction(request)
    expect(result).toBe(commonResult)
  })

  it('should pass request object to common result handler', async () => {
    const request = getMockRequest()
    await resultFunction(request)
    expect(CommonResultHandler).toHaveBeenCalledWith(request)
  })

  it('should return ok if licenceToStart is after payment', async () => {
    CommonResultHandler.mockReturnValue(CommonResults.OK)
    const request = getMockRequest({ licenceToStart: 'after-payment', licenceLength: '1D' })
    const result = await resultFunction(request)
    expect(result).toBe(CommonResults.OK)
  })

  it('should return ok if licenceLength is 12M', async () => {
    CommonResultHandler.mockReturnValue(CommonResults.OK)
    const request = getMockRequest({ licenceToStart: false, licenceLength: '12M' })
    const result = await resultFunction(request)
    expect(result).toBe(CommonResults.OK)
  })

  it.each([['8D'], ['1D']])(
    'should return require-time if fromSummary and fromLicenceOptions are false and licence starts later and is not 12M',
    async length => {
      CommonResultHandler.mockReturnValue(CommonResults.OK)
      const request = getMockRequest({ licenceToStart: false, licenceLength: length })
      const result = await resultFunction(request)
      expect(result).toBe(licenceLengthResults.REQUIRE_TIME)
    }
  )
})
