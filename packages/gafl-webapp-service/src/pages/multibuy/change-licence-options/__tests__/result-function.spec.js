import resultFunction from '../result-function'
import { CommonResults, MultibuyForYou, ShowDigitalLicencePages } from '../../../../constants.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))

jest.mock('../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))

describe('change-licence-options > result-function', () => {
  const mockStatusCacheGet = jest.fn()
  const mockTransactionPageGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        transaction: {
          getCurrentPermission: mockTransactionPageGet
        }
      }
    })
  }

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return the digital licence screen, if licence is in renewal, is 12 months and showDigitalLicencePages is true', async () => {
      isPhysical.mockReturnValueOnce(true)
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true, showDigitalLicencePages: true }))
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          postalFulfilment: true
        }
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(ShowDigitalLicencePages.YES)
    })

    it('should return the summary screen, if licence is in renewal, is 12 months and showDigitalLicencePages is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true, showDigitalLicencePages: false }))
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          postalFulfilment: false
        }
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok, if licence is 12 months and showDigitalLicencePages is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ showDigitalLicencePages: true }))
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          postalFulfilment: true
        }
      }))
      isMultibuyForYou.mockImplementationOnce(() => false)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return amend if fromChangeOptions is seen', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromChangeLicenceOptions: 'seen' }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return ok if fromChangeLicenceOptions is not seen', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromChangeLicenceOptions: 'not-options' }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return isMultibuyForYou when is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: false }))
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(MultibuyForYou.YES)
    })

    it('should not return isMultibuyForYou when is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: false }))
      isMultibuyForYou.mockImplementationOnce(() => false)
      const result = await resultFunction(mockRequest)
      expect(result).not.toBe(MultibuyForYou.YES)
    })
  })
})
