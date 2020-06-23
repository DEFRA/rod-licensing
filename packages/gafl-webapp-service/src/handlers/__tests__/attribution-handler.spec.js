import { UTM } from '../../constants'
import attributionHandler from '../attribution-handler'

jest.mock('../../constants', () => ({
  UTM: {
    CAMPAIGN: 'utmcampaign',
    MEDIUM: 'utmmedium'
  }
}))

describe('The attribution handler', () => {
  /*
  create a session
  save the google campaign tracking data (as described under https://support.google.com/analytics/answer/1033863?hl=en) on the session
  send a server redirect to a configurable endpoint (which in production will be the GOV.UK hosted landing page)
  */
  it('Persists UTM Campaign value to status cache', () => {
    const sampleUtmCampaign = 'campaign-12'
    const request = generateRequestMock(sampleUtmCampaign)
    attributionHandler(request, generateResponseToolkitMock())
    expect(request.cache.mock.results[0].value.helpers.status.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [UTM.CAMPAIGN]: sampleUtmCampaign
      })
    )
  })

  it('persists utm_medium value to status cache', () => {
    const sampleUtmMedium = 'click_bait'
    const request = generateRequestMock(undefined, sampleUtmMedium)
    attributionHandler(request, generateResponseToolkitMock())
    expect(request.cache.mock.results[0].value.helpers.status.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [UTM.MEDIUM]: sampleUtmMedium
      })
    )
  })

  it('persists existing values in status cache', () => {
    const sampleStatus = {
      dcHeroes: ['Superman', 'Batman', 'Wonder Woman'],
      marvelHeroes: ['Captain America', 'Black Widow', 'Iron Man']
    }
    const request = generateRequestMock(undefined, undefined, sampleStatus)
    attributionHandler(request, generateResponseToolkitMock())
    expect(request.cache.mock.results[0].value.helpers.status.set).toHaveBeenCalledWith(
      expect.objectContaining(sampleStatus)
    )
  })

  it('redirects to configurable endpoint', () => {
    const OLD_ENV = process.env
    process.env.ATTRIBUTION_REDIRECT = 'https://get-fishing-licence.service.gov.uk'
    const responseToolkit = generateResponseToolkitMock()
    attributionHandler(generateRequestMock(), responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(process.env.ATTRIBUTION_REDIRECT)
    process.env = OLD_ENV
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
