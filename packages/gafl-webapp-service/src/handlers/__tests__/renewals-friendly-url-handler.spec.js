import { UTM, QUERYSTRING_LICENCE_KEY } from '../../constants'
import urlHandler from '../renewals-friendly-url-handler'
import { IDENTIFY } from '../../uri'

jest.mock('../../constants', () => ({
  UTM: {
    CAMPAIGN: 'utmcampaign',
    MEDIUM: 'utmmedium',
    CONTENT: 'utmcontent',
    SOURCE: 'utmsource',
    TERM: 'utmterm'
  },
  RENEWALS_CAMPAIGN_ID: 'renewals',
  AEN_INVITATION_ID: 'aen_invitation',
  QUERYSTRING_LICENCE_KEY: 'reference'
}))

jest.mock('../../uri', () => ({
  ATTRIBUTION: { uri: '/attribution-url' },
  IDENTIFY: { uri: '/renewal-url' }
}))

describe('The url handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns identify if no licence key', async () => {
    const params = {
      [UTM.CAMPAIGN]: 'renewals',
      [QUERYSTRING_LICENCE_KEY]: null
    }
    const request = generateRequestMock(params)
    const responseToolkit = generateResponseToolkitMock()
    await urlHandler(request, responseToolkit)
    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(request, IDENTIFY.uri)
  })

  it.each([['B2F11U'], ['AH56F6'], ['GH330P']])('6 digit reference number exists and returns ATTRIBUTION', async licenceKey => {
    const params = {
      [QUERYSTRING_LICENCE_KEY]: licenceKey
    }
    const request = generateRequestMock(params)
    const responseToolkit = generateResponseToolkitMock()
    await urlHandler(request, responseToolkit)
    const regExMatch = new RegExp(`^/attribution-url\\?utmcampaign\\=renewals&utmsource\\=aen_invitation&reference\\=${licenceKey}$`)
    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(request, expect.stringMatching(regExMatch))
  })

  it.each([['B2F11UH5D'], ['AH56'], ['GH330PPTD']])('reference number is not 6 digits and returns back to IDENTIFY', async licenceKey => {
    const params = {
      [UTM.CAMPAIGN]: 'renewals',
      [UTM.SOURCE]: 'aen_invitation',
      [QUERYSTRING_LICENCE_KEY]: licenceKey
    }
    const request = generateRequestMock(params)
    const responseToolkit = generateResponseToolkitMock()
    await urlHandler(request, responseToolkit)
    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(request, IDENTIFY.uri)
  })

  const generateRequestMock = (params, query, status = {}) => ({
    params,
    query: { _ga: null },
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
