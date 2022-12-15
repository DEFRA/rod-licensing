import backLinkHandlerContact from '../back-link-handler-contact.js'
import { CONTACT_SUMMARY, CHANGE_CONTACT_DETAILS, LICENCE_SUMMARY } from '../../uri.js'
import { CONTACT_SUMMARY_SEEN, CHANGE_CONTACT_DETAILS_SEEN } from '../../constants.js'

describe('back-link-handler-contact', () => {
  it('should return defaultUrl if request does not have cache function', async () => {
    const result = await backLinkHandlerContact({}, 'aDefaultUrl')
    expect(result).toBe('aDefaultUrl')
  })

  it('should return CHANGE_CONTACT_DETAILS uri if changeContactDetailsSeen is true', async () => {
    const status = {
      fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.SEEN
    }
    const result = await backLinkHandlerContact(status, 'aPage')
    expect(result).toBe(CHANGE_CONTACT_DETAILS.uri)
  })

  it('should return CONTACT_SUMMARY uri if contact summary is seen', async () => {
    const status = {
      fromSummary: CONTACT_SUMMARY_SEEN
    }
    const result = await backLinkHandlerContact(status, 'aPage')
    expect(result).toBe(CONTACT_SUMMARY.uri)
  })

  it('should return LICENCE_SUMMARY uri if going through a renewal', async () => {
    const status = {
      isRenewal: true
    }
    const result = await backLinkHandlerContact(status, 'aPage')
    expect(result).toBe(LICENCE_SUMMARY.uri)
  })
})
