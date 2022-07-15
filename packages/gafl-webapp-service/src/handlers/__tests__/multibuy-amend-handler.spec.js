import multibuyAmendHandler from '../multibuy-amend-handler.js'
import { CommonResults } from '../../constants.js'

describe('multibuy-amend-handler', () => {
  const mockStatusCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        }
      }
    })
  }

  describe('default', () => {
    it('should return summary if fromSummary is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true, fromLicenceOptions: false }))
      const result = await multibuyAmendHandler(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return summary if fromlicenceOptions is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: true }))
      const result = await multibuyAmendHandler(mockRequest)
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return summary if both fromLicenceOptions and fromSummary are false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: false }))
      const result = await multibuyAmendHandler(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
