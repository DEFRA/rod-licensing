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
  let consoleWarn
  beforeEach(() => {
    consoleWarn = console.warn
  })
  afterEach(() => {
    console.warn = consoleWarn
  })

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

  it("generates a warning if campaign or source aren't set", async () => {
    const query = {}
    console.warn = jest.fn()
    await attributionHandler(generateRequestMock(query), generateResponseToolkitMock())
    expect(console.warn).toHaveBeenCalledWith('Campaign and source values should be set in attribution')
  })

  it("doesn't generate a warning if campaign and source are set", async () => {
    const query = { [UTM.CAMPAIGN]: 'Gallic', [UTM.SOURCE]: 'brown' }
    console.warn = jest.fn()
    await attributionHandler(generateRequestMock(query), generateResponseToolkitMock())
    expect(console.warn).not.toHaveBeenCalled()
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
