import { hasJunior } from '../../../../processors/concession-helper'
import resultFunction, { licenceTypeResults } from '../result-function'
import CommonResultHandler from '../../../../handlers/multibuy-amend-handler.js'

jest.mock('../../../../handlers/multibuy-amend-handler.js', () => jest.fn(() => {}))

jest.mock('../../../../processors/concession-helper.js', () => ({
  hasJunior: jest.fn()
}))

jest.mock('../../../../processors/concession-helper.js', () => ({
  hasJunior: jest.fn()
}))

describe('licence-type > result-function', () => {
  const getMockRequest = (type, numOfRods) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: async () => ({
            licenceType: type,
            numberOfRods: numOfRods,
            concessions: {
              type: 'Junior'
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
      const result = await resultFunction(getMockRequest())
      expect(result).toBe(commonResult)
    })

    it('should pass request object to common result handler', async () => {
      const request = getMockRequest()
      await resultFunction(request)
      expect(CommonResultHandler).toHaveBeenCalledWith(request)
    })

    it('should pass request object to has junior handler', async () => {
      CommonResultHandler.mockReturnValue('ok')
      const request = getMockRequest()
      await resultFunction(request)
      const permission = await request.cache().helpers.transaction.getCurrentPermission()
      expect(hasJunior).toHaveBeenCalledWith(permission)
    })

    it('should return to skip licence length if the licensee has junior', async () => {
      CommonResultHandler.mockReturnValue('ok')
      hasJunior.mockReturnValue('Junior')
      const result = await resultFunction(getMockRequest())
      expect(result).toBe(licenceTypeResults.SKIP_LICENCE_LENGTH)
    })

    it('should return to skip licence length if the licence is 3 rods trout-and-coarse', async () => {
      CommonResultHandler.mockReturnValue('ok')
      hasJunior.mockReturnValueOnce(false)
      const result = await resultFunction(getMockRequest('Trout and coarse', '3'))
      expect(result).toBe(licenceTypeResults.SKIP_LICENCE_LENGTH)
    })

    it('should return ask licence length if the licensee requires a licence', async () => {
      CommonResultHandler.mockReturnValue('ok')
      hasJunior.mockReturnValueOnce(false)
      const result = await resultFunction(getMockRequest('some other licence', '2'))
      expect(result).toBe(licenceTypeResults.ASK_LICENCE_LENGTH)
    })
  })
})
