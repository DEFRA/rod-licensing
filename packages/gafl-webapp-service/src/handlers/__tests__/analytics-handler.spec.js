import { ANALYTICS } from '../../constants.js'
import analyticsHandler from '../analytics-handler.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'

jest.mock('../../processors/uri-helper.js')

jest.mock('../../constants', () => ({
  ANALYTICS: {
    selected: 'selected',
    acceptTracking: 'accepted-tracking',
    seenMessage: 'seen-message'
  }
}))

describe('The analytics handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['https://localhost:3000', 'https://localhost:3000/buy/name', 'https://localhost:3000', '/buy/name'],
    ['https://localhost:1234', 'https://localhost:1234/example/test/redirect', 'https://localhost:1234', '/example/test/redirect'],
    [
      'https://testserver-example-fish',
      'https://testserver-example-fish/buy/renew/identify',
      'https://testserver-example-fish',
      '/buy/renew/identify'
    ]
  ])('redirects to correct page if url matches header', async (origin, referer, host, redirect) => {
    const payload = {
      analyticsResponse: 'accept'
    }
    const request = generateRequestMock(payload, 'analytics', origin, referer, host)
    const responseToolkit = generateResponseToolkitMock()
    await analyticsHandler(request, responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(addLanguageCodeToUri(request, redirect))
  })

  it.each([
    ['https://localhost:3000', 'https://localhost:3000/buy/name', 'https://localhost:3047'],
    ['https://localhost:1234', 'https://localhost:1234/example/test/redirect', 'https://notsamehost:1234'],
    ['https://testserver-example-fish', 'https://testserver-example-fish/buy/renew/identify', 'https://hdfhdskfhs-ghj-vgjh']
  ])('redirects to correct page if url matches header', async (origin, referer, host) => {
    const payload = {
      analyticsResponse: 'accept'
    }
    const request = generateRequestMock(payload, 'analytics', origin, referer, host)
    const responseToolkit = generateResponseToolkitMock()
    await analyticsHandler(request, responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(addLanguageCodeToUri(request, '/buy'))
  })

  it('get calls addLanguageCodeToUri with request and /buy', async () => {
    const origin = 'https://localhost:3000'
    const referer = 'https://localhost:3000/buy'
    const redirect = '/buy'
    const payload = {
      analyticsResponse: 'accept'
    }
    const responseToolkit = generateResponseToolkitMock()
    const request = generateRequestMock(payload, 'analytics', origin, referer)

    await analyticsHandler(request, responseToolkit)

    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, redirect)
  })

  it('selected not true and response is accept sets selected to true and acceptTracking to true', async () => {
    const payload = {
      analyticsResponse: 'accept'
    }

    const request = generateRequestMock(payload, 'analytics', 'origin', 'referer')
    await analyticsHandler(request, generateResponseToolkitMock())
    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.selected]: true, [ANALYTICS.acceptTracking]: true }))
  })

  it('selected not true and response is reject sets selected to true and acceptTracking to false', async () => {
    const payload = {
      analyticsResponse: 'reject'
    }
    const request = generateRequestMock(payload, 'analytics', 'origin', 'referer')
    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(
      expect.objectContaining({ [ANALYTICS.selected]: true, [ANALYTICS.acceptTracking]: false })
    )
  })

  it('selected is true sets seenMessage to true', async () => {
    const analytics = {
      [ANALYTICS.selected]: true
    }

    const request = generateRequestMock('payload', analytics, 'origin', 'referer')
    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.seenMessage]: true }))
  })

  const mockAnalyticsSet = jest.fn()

  const generateRequestMock = (payload, analytics, origin, referer, host = {}) => ({
    payload,
    url: {
      search: ''
    },
    cache: jest.fn(() => ({
      helpers: {
        analytics: {
          get: jest.fn(() => analytics),
          set: mockAnalyticsSet
        }
      }
    })),
    headers: {
      origin,
      referer
    },
    _url: {
      host
    }
  })

  const generateResponseToolkitMock = () => ({
    redirect: jest.fn()
  })
})
