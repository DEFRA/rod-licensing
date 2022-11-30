import backLinkHandler from '../back-link-handler'
import { CHANGE_LICENCE_OPTIONS, LICENCE_SUMMARY, CONTACT_SUMMARY, CHANGE_CONTACT_DETAILS } from '../../uri.js'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN, CHANGE_LICENCE_OPTIONS_SEEN, CHANGE_CONTACT_DETAILS_SEEN } from '../../constants.js'

describe('back-link-handler', () => {
  describe('default', () => {
    it('should return defaultUrl if request does not have cache function', async () => {
      const result = await backLinkHandler({}, 'aDefaultUrl')
      expect(result).toBe('aDefaultUrl')
    })

    it('should return CHANGE_LICENCE_OPTIONS uri if changeLicenceOptionsSeen is true', async () => {
      const status = {
        fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN
      }
      const result = await backLinkHandler(status, 'aPage')
      expect(result).toBe(CHANGE_LICENCE_OPTIONS.uri)
    })

    it('should return CHANGE_CONTACT_DETAILS uri if changeContactDetailsSeen is true', async () => {
      const status = {
        fromContactDetails: CHANGE_CONTACT_DETAILS_SEEN.SEEN
      }
      const result = await backLinkHandler(status, 'aPage')
      expect(result).toBe(CHANGE_CONTACT_DETAILS.uri)
    })

    it('should return LICENCE_SUMMARY uri if licence Summary is seen', async () => {
      const status = {
        fromSummary: LICENCE_SUMMARY_SEEN
      }
      const result = await backLinkHandler(status, 'aPage')
      expect(result).toBe(LICENCE_SUMMARY.uri)
    })

    it('should return LICENCE_SUMMARY uri if going through a renewal', async () => {
      const status = {
        isRenewal: true
      }
      const result = await backLinkHandler(status, 'aPage')
      expect(result).toBe(LICENCE_SUMMARY.uri)
    })

    it('should return CONTACT_SUMMARY uri if contact summary is seen', async () => {
      const status = {
        fromSummary: CONTACT_SUMMARY_SEEN
      }
      const result = await backLinkHandler(status, 'aPage')
      expect(result).toBe(CONTACT_SUMMARY.uri)
    })
  })
})
