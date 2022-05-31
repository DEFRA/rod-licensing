import resultFunction, { licenceLengthResults } from '../result-function'
import { CommonResults } from '../../../../constants'

describe('licence-length > result-function', () => {
  const mockTransationCacheGet = jest.fn()
  const mockStatusCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransationCacheGet
        },
        status: {
          getCurrentPermission: mockStatusCacheGet
        }
      }
    })
  }

  describe('default', () => {
    it('should return summary if fromSummary is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true, fromLicenceOptions: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return summary if fromlicenceOptions is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return ok if licenceToStart is after payment', async () => {
      mockTransationCacheGet.mockImplementationOnce(() => ({ licenceToStart: 'after-payment' }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return ok if licenceLength is 12M', async () => {
      mockTransationCacheGet.mockImplementationOnce(() => ({ licenceLength: '12M' }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it.each([
      ['8D'],
      ['1D']
    ])('should return require-time if fromSummary and fromLicenceOptions are false and licence starts later and is not 12M', async (length) => {
      mockTransationCacheGet.mockImplementationOnce(() => ({ licenceLength: length }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(licenceLengthResults.REQUIRE_TIME)
    })
  })
})
