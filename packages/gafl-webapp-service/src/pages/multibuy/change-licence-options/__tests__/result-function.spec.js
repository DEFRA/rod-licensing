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
  })
})
