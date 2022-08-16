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
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true, fromLicenceOptions: false, fromContactOptions: false }))
      const result = await multibuyAmendHandler(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return amend if fromlicenceOptions is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: true, fromContactOptions: false }))
      const result = await multibuyAmendHandler(mockRequest)
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return amend if fromContactOptions is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: false, fromContactOptions: true }))
      const result = await multibuyAmendHandler(mockRequest)
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return ok if both fromLicenceOptions and fromSummary are false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, fromLicenceOptions: false, fromContactOptions: false }))
      const result = await multibuyAmendHandler(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
