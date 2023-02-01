import { UTM, ATTRIBUTION_REDIRECT_DEFAULT, QUERYSTRING_LICENCE_KEY } from '../../constants'
import attributionHandler from '../attribution-handler'
import { RENEWAL_BASE, IDENTIFY } from '../../uri'

jest.mock('../../constants', () => ({
  UTM: {
    CAMPAIGN: 'utmcampaign',
    MEDIUM: 'utmmedium',
    CONTENT: 'utmcontent',
    SOURCE: 'utmsource',
    TERM: 'utmterm'
  },
  RENEWALS_CAMPAIGN_ID: 'RENEWALS_CAMPAIGN_ID',
  ATTRIBUTION_REDIRECT_DEFAULT: '/attribution/redirect/default'
}))

jest.mock('../../uri', () => ({
  RENEWAL_BASE: { uri: '/licence-renew-url' },
  IDENTIFY: { uri: '/renewal-url' }
}))

describe('The attribution handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('persists all UTM values as attribution to status cache, if campaign and source are present', async () => {
    const query = {
      [UTM.CAMPAIGN]: 'campaign-12',
      [UTM.MEDIUM]: 'click_bait',
      [UTM.CONTENT]: 'eieioh',
      [UTM.SOURCE]: 'tomato',
      [UTM.TERM]: 'Michaelmas'
    }
    const request = generateRequestMock(query)
    await attributionHandler(request, generateResponseToolkitMock())
    expect(request.cache.mock.results[0].value.helpers.status.set).toHaveBeenCalledWith({
      attribution: expect.objectContaining(query)
    })
  })

  it('persists undefined as attribution to status cache, if campaign and source are not present', async () => {
    const query = {
      [UTM.MEDIUM]: 'click_bait',
      [UTM.CONTENT]: 'eieioh',
      [UTM.TERM]: 'Michaelmas'
    }
    const request = generateRequestMock(query)
    await attributionHandler(request, generateResponseToolkitMock())
    expect(request.cache.mock.results[0].value.helpers.status.set).toHaveBeenCalledWith({
      attribution: undefined
    })
  })

  it.each([['campaign-12'], ['sample-campaign'], ['important-campaign']])(
    "redirects to ATTRIBUTION_REDIRECT_DEFAULT if ATTRIBUTION_REDIRECT env var isn't set",
    async campaign => {
      delete process.env.ATTRIBUTION_REDIRECT
      const query = {
        [UTM.CAMPAIGN]: campaign,
        [UTM.MEDIUM]: 'click_bait',
        [UTM.CONTENT]: 'eieioh',
        [UTM.SOURCE]: 'tomato',
        [UTM.TERM]: 'Michaelmas'
      }
      const responseToolkit = generateResponseToolkitMock()
      await attributionHandler(generateRequestMock(query), responseToolkit)
      expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(ATTRIBUTION_REDIRECT_DEFAULT)
    }
  )

  it("redirects to ATTRIBUTION_REDIRECT env var if it's set", async () => {
    const attributionRedirect = '/attribution/redirect'
    process.env.ATTRIBUTION_REDIRECT = attributionRedirect
    const query = {
      [UTM.CAMPAIGN]: 'campaign-12',
      [UTM.MEDIUM]: 'click_bait',
      [UTM.CONTENT]: 'eieioh',
      [UTM.SOURCE]: 'tomato',
      [UTM.TERM]: 'Michaelmas'
    }
    const responseToolkit = generateResponseToolkitMock()
    await attributionHandler(generateRequestMock(query), responseToolkit)
    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(attributionRedirect)
    delete process.env.ATTRIBUTION_REDIRECT
  })

  it('redirects to RENEWAL_BASE if journey is renewal', async () => {
    const query = {
      [UTM.CAMPAIGN]: 'RENEWALS_CAMPAIGN_ID',
      [UTM.MEDIUM]: 'click_bait',
      [UTM.CONTENT]: 'eieioh',
      [UTM.SOURCE]: 'tomato',
      [UTM.TERM]: 'Michaelmas'
    }
    const responseToolkit = generateResponseToolkitMock()

    await attributionHandler(generateRequestMock(query), responseToolkit)
    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(IDENTIFY.uri)
  })

  it('redirects begins with { IDENTIFY } when journey is renewal', async () => {
    const query = {
      [UTM.CAMPAIGN]: 'RENEWALS_CAMPAIGN_ID',
      [UTM.MEDIUM]: 'click_bait',
      [UTM.CONTENT]: 'eieioh',
      [UTM.SOURCE]: 'tomato',
      [UTM.TERM]: 'Michaelmas'
    }
    const responseToolkit = generateResponseToolkitMock()
    const regExMatch = new RegExp(`^${IDENTIFY.uri}`)

    await attributionHandler(generateRequestMock(query), responseToolkit)
    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(expect.stringMatching(regExMatch))
  })

  it.each([['B2F11U'], ['AH56F6'], ['GH330P']])(
    'test renewal includes reference number when journey is renewal and reference number exists',
    async licenceKey => {
      const query = {
        [UTM.CAMPAIGN]: 'RENEWALS_CAMPAIGN_ID',
        [UTM.MEDIUM]: 'click_bait',
        [UTM.CONTENT]: 'eieioh',
        [UTM.SOURCE]: 'tomato',
        [UTM.TERM]: 'Michaelmas',
        [QUERYSTRING_LICENCE_KEY]: licenceKey
      }
      const responseToolkit = generateResponseToolkitMock()
      await attributionHandler(generateRequestMock(query), responseToolkit)
      const regExMatch = new RegExp(`^${RENEWAL_BASE.uri}/${licenceKey}$`)
      expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(expect.stringMatching(regExMatch))
    }
  )

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
    redirectWithLanguageCode: jest.fn()
  })
})
