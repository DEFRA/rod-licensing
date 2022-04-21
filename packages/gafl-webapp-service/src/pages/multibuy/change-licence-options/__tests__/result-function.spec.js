import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
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

    it('should return ok, if licence is 12 months and showDigitalLicencePages is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ showDigitalLicencePages: true }))
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          postalFulfilment: true
        }
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return options if fromChangeOptions is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromChangeLicenceOptions: 'change-licence-options', CHANGE_LICENCE_OPTIONS_SEEN: 'change-licence-options' }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return ok if fromChangeLicenceOptions is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromChangeLicenceOptions: 'not-options', CHANGE_LICENCE_OPTIONS_SEEN: 'change-licence-options' }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
