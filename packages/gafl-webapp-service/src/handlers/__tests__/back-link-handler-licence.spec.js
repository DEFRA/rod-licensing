import backLinkHandler from '../back-link-handler-licence.js'
import { CHANGE_LICENCE_OPTIONS, LICENCE_SUMMARY } from '../../uri.js'
import { LICENCE_SUMMARY_SEEN, CHANGE_LICENCE_OPTIONS_SEEN } from '../../constants.js'

describe('back-link-handler-licence', () => {
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
})
