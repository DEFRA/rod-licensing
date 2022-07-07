import resultFunction, { ageConcessionResults } from '../result-function'
import CommonResultHandler from '../../../../handlers/multibuy-amend-handler.js'

jest.mock('../../../../handlers/multibuy-amend-handler.js', () => jest.fn(() => {}))

describe('date-of-birth > result-function', () => {
  const getMockRequest = licenceRequired => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: async () => ({
            licensee: {
              noLicenceRequired: licenceRequired
            }
          })
        }
      }
    })
  })

  describe('default', () => {
    it('should return the value of common result handler', async () => {
      const commonResult = Symbol('Common Result')
      CommonResultHandler.mockReturnValue(commonResult)
      const result = await resultFunction(getMockRequest(false))
      expect(result).toEqual(commonResult)
    })

    it('should pass request object to common result handler', async () => {
      const request = getMockRequest(false)
      await resultFunction(request)
      expect(CommonResultHandler).toHaveBeenCalledWith(request)
    })

    it('should return noLicenceRequired if licensee noLicenceRequired flag is true', async () => {
      const result = await resultFunction(getMockRequest(true))
      expect(result).toBe(ageConcessionResults.NO_LICENCE_REQUIRED)
    })
  })
})
