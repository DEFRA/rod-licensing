import resultFunction, { ageConcessionResults } from '../result-function'
import { CommonResults } from '../../../../constants'

describe('date-of-birth > result-function', () => {
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
      mockTransationCacheGet.mockImplementationOnce(() => ({ licensee: { noLicenceRequired: false } }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true, fromLicenceOptions: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return summary if fromlicenceOptions is true', async () => {
      mockTransationCacheGet.mockImplementationOnce(() => ({ licensee: { noLicenceRequired: false } }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return ok if both fromLicenceOptions and fromSummary are false', async () => {
      mockTransationCacheGet.mockImplementationOnce(() => ({ licensee: { noLicenceRequired: false } }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return noLicenceRequired if fromSummary is true', async () => {
      mockTransationCacheGet.mockImplementationOnce(() => ({ licensee: { noLicenceRequired: true } }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(ageConcessionResults.NO_LICENCE_REQUIRED)
    })
  })
})
