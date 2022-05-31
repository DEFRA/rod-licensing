import backLinkHandler from "../back-link-handler"
import {
  CHANGE_LICENCE_OPTIONS,
  LICENCE_SUMMARY
} from '../../routes'

describe('back-link-handler', async () => {
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
    it('should return CHANGE_LICENCE_OPTIONS uri if changeLicenceOptionsSeen is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromLicenceOptions: true }))
      const result = await backLinkHandler(mockRequest)
      expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
    })
  })
})
