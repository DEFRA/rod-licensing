import { UTM, ATTRIBUTION_REDIRECT_DEFAULT } from '../../constants'
import attributionHandler from '../attribution-handler'

jest.mock('../../constants', () => ({
  UTM: {
    CAMPAIGN: 'utmcampaign',
    MEDIUM: 'utmmedium',
    CONTENT: 'utmcontent',
    SOURCE: 'utmsource',
    TERM: 'utmterm'
  },
  ATTRIBUTION_REDIRECT_DEFAULT: '/attribution/redirect/default'
}))

describe('The attribution handler', () => {
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

  it("redirects to ATTRIBUTION_REDIRECT_DEFAULT if ATTRIBUTION_REDIRECT env var isn't set", async () => {
    delete process.env.ATTRIBUTION_REDIRECT
    const query = { [UTM.CAMPAIGN]: 'campaign', [UTM.MEDIUM]: 'popup' }
    const responseToolkit = generateResponseToolkitMock()
    await attributionHandler(generateRequestMock(query), responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(ATTRIBUTION_REDIRECT_DEFAULT)
  })

  it("redirects to ATTRIBUTION_REDIRECT env var if it's set", async () => {
    const attributionRedirect = '/attribution/redirect'
    process.env.ATTRIBUTION_REDIRECT = attributionRedirect
    const query = { [UTM.CAMPAIGN]: 'campaign', [UTM.MEDIUM]: 'popup' }
    const responseToolkit = generateResponseToolkitMock()
    await attributionHandler(generateRequestMock(query), responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(attributionRedirect)
    delete process.env.ATTRIBUTION_REDIRECT
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
