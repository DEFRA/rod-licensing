import { UTM } from '../../constants'
import attributionHandler from '../attribution-handler'
import { LICENCE_LENGTH } from '../../uri'

jest.mock('../../constants', () => ({
  UTM: {
    CAMPAIGN: 'utmcampaign',
    MEDIUM: 'utmmedium'
  }
}))

jest.mock('../../uri', () => ({
  LICENCE_LENGTH: { uri: '/path/to/license/length' }
}))

describe('The attribution handler', () => {
  /*
  create a session
  save the google campaign tracking data (as described under https://support.google.com/analytics/answer/1033863?hl=en) on the session
  send a server redirect to a configurable endpoint (which in production will be the GOV.UK hosted landing page)
  */
  it('Persists UTM Campaign value to status cache', async () => {
    const sampleUtmCampaign = 'campaign-12'
    const request = generateRequestMock(sampleUtmCampaign)
    await attributionHandler(request, generateResponseToolkitMock())
    expect(request.cache.mock.results[0].value.helpers.status.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [UTM.CAMPAIGN]: sampleUtmCampaign
      })
    )
  })

  it('persists utm_medium value to status cache', async () => {
    const sampleUtmMedium = 'click_bait'
    const request = generateRequestMock(undefined, sampleUtmMedium)
    await attributionHandler(request, generateResponseToolkitMock())
    expect(request.cache.mock.results[0].value.helpers.status.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [UTM.MEDIUM]: sampleUtmMedium
      })
    )
  })

  it('redirects to licence length endpoint', async () => {
    const responseToolkit = generateResponseToolkitMock()
    await attributionHandler(generateRequestMock(), responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(LICENCE_LENGTH.uri)
  })

  const generateRequestMock = (utm_campaign = '', utm_medium = '', status = {}) => ({
    query: {
      [UTM.CAMPAIGN]: utm_campaign,
      [UTM.MEDIUM]: utm_medium
    },
    cache: jest.fn(() => ({
      helpers: {
        status: {
          get: jest.fn(() => status),
          set: jest.fn()
        }
      }
    }))
  })

  const generateResponseToolkitMock = () => ({
    redirect: jest.fn()
  })
})
