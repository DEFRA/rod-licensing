import { UTM, QUERYSTRING_LICENCE_KEY } from '../../constants'
import urlHandler from '../url-handler'
import { RENEWAL_LICENCE, IDENTIFY } from '../../uri'

jest.mock('../../constants', () => ({
  UTM: {
    CAMPAIGN: 'utmcampaign',
    MEDIUM: 'utmmedium',
    CONTENT: 'utmcontent',
    SOURCE: 'utmsource',
    TERM: 'utmterm'
  }
}))

jest.mock('../../uri', () => ({
  RENEWAL_LICENCE: { uri: '/licence-renew-url' },
  IDENTIFY: { uri: '/renewal-url' }
}))

describe('The url handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('test returns identify if no licence key', async () => {
    const query = {
      [UTM.CAMPAIGN]: 'renewals',
      [QUERYSTRING_LICENCE_KEY]: null
    }
    const responseToolkit = generateResponseToolkitMock()
    await urlHandler(generateRequestMock(query), responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(IDENTIFY.uri)
  })

  it.each([
    ['B2F11U'],
    ['AH56F6'],
    ['GH330P']
  ])('test 6 digit reference number exists and returns RENEWAL_LICENCE', async licenceKey => {
    const query = {
      [UTM.CAMPAIGN]: 'renewals',
      [QUERYSTRING_LICENCE_KEY]: licenceKey
    }
    const responseToolkit = generateResponseToolkitMock()
    await urlHandler(generateRequestMock(query), responseToolkit)
    const regExMatch = new RegExp(`^${RENEWAL_LICENCE.uri}/${licenceKey}$`)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(expect.stringMatching(regExMatch))
  })

  it.each([
    ['B2F11UH5D'],
    ['AH56'],
    ['GH330PPTD']
  ])('test reference number is not 6 digits and returns back to IDENTIFY', async licenceKey => {
    const query = {
      [UTM.CAMPAIGN]: 'renewals',
      [QUERYSTRING_LICENCE_KEY]: licenceKey
    }
    const responseToolkit = generateResponseToolkitMock()
    await urlHandler(generateRequestMock(query), responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(IDENTIFY.uri)
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
