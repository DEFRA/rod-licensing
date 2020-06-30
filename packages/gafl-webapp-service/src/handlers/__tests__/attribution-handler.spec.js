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
  it.each([
    [UTM.CAMPAIGN, 'campaign-12'],
    [UTM.MEDIUM, 'click_bait'],
    [UTM.CONTENT, 'eieioh'],
    [UTM.SOURCE, 'tomato'],
    [UTM.TERM, 'Michaelmas']
  ])('Persists UTM values to status cache', async (utmValue, sampleValue) => {
    const request = generateRequestMock({ [utmValue]: sampleValue })
    await attributionHandler(request, generateResponseToolkitMock())
    expect(request.cache.mock.results[0].value.helpers.status.set).toHaveBeenCalledWith({
      attribution: expect.objectContaining({ [utmValue]: sampleValue })
    })
  })

  it('redirects to licence length endpoint', async () => {
    const query = { [UTM.CAMPAIGN]: 'campaign', [UTM.MEDIUM]: 'popup' }
    const responseToolkit = generateResponseToolkitMock()
    await attributionHandler(generateRequestMock(query), responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(LICENCE_LENGTH.uri)
  })

  const generateRequestMock = (query, status = {}) => ({
    query,
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
