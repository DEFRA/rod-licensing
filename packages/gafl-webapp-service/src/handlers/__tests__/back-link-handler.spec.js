import backLinkHandler from '../back-link-handler'
import { CHANGE_LICENCE_OPTIONS, LICENCE_SUMMARY, CONTACT_SUMMARY } from '../../uri.js'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../constants.js'

describe('back-link-handler', () => {
  jest.mock('../../constants', () => ({
    LICENCE_SUMMARY_SEEN: 'seen-licence-summary',
    CONTACT_SUMMARY_SEEN: 'seen-contact-summary'
  }))
  describe('default', () => {
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

    it('should return defaultUrl if request does not have cache function', async () => {
      const result = await backLinkHandler({}, 'aDefaultUrl')
      console.log(result)
      expect(result).toBe('aDefaultUrl')
    })

    it('should return CHANGE_LICENCE_OPTIONS uri if changeLicenceOptionsSeen is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromLicenceOptions: true }))
      const result = await backLinkHandler(mockRequest, 'aPage')
      expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
    })

    it('should return LICENCE_SUMMARY uri if licence Summary is seen', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: LICENCE_SUMMARY_SEEN }))
      const result = await backLinkHandler(mockRequest, 'aPage')
      expect(result).toBe(LICENCE_SUMMARY.uri)
    })
    it('should return contact_SUMMARY uri if contact summary is seen', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: CONTACT_SUMMARY_SEEN }))
      const result = await backLinkHandler(mockRequest, 'aPage')
      expect(result).toBe(CONTACT_SUMMARY.uri)
    })

    it('should return defaultUri if summary pages and licence options pages not seen', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
      const result = await backLinkHandler(mockRequest, 'aDefaultUrl')
      expect(result).toBe('aDefaultUrl')
    })
  })
})
