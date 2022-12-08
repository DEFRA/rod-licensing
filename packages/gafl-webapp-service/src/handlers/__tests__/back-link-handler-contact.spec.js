import backLinkHandler from '../back-link-handler-licence'
import { CONTACT_SUMMARY, CHANGE_CONTACT_DETAILS } from '../../uri.js'
import { CONTACT_SUMMARY_SEEN, CHANGE_CONTACT_DETAILS_SEEN } from '../../constants.js'

describe('back-link-handler', () => {
  describe('default', () => {
    it('should return defaultUrl if request does not have cache function', async () => {
      const result = await backLinkHandler({}, 'aDefaultUrl')
      expect(result).toBe('aDefaultUrl')
    })

    it('should return CHANGE_CONTACT_DETAILS uri if changeContactDetailsSeen is true', async () => {
      const status = {
        fromContactDetails: CHANGE_CONTACT_DETAILS_SEEN.SEEN
      }
      const result = await backLinkHandler(status, 'aPage')
      expect(result).toBe(CHANGE_CONTACT_DETAILS.uri)
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
