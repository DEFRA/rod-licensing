import { ANALYTICS } from '../../constants.js'
import analyticsHandler from '../analytics-handler.js'

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
    ['https://localhost:3000', 'https://localhost:3000/buy/name', 'localhost:3000', '/buy/name'],
    ['https://localhost:1234', 'https://localhost:1234/example/test/redirect', 'localhost:1234', '/example/test/redirect'],
    [
      'https://testserver-example-fish',
      'https://testserver-example-fish/buy/renew/identify',
      'testserver-example-fish',
      '/buy/renew/identify'
    ]
  ])('redirects to correct page if the HTTP_REFERER host matches the host of the current page', async (origin, referer, host, redirect) => {
    const payload = { analyticsResponse: 'accept' }
    const headers = { origin, referer }
    const request = generateRequestMock(payload, 'analytics', headers, host)
    const responseToolkit = generateResponseToolkitMock()

    await analyticsHandler(request, responseToolkit)

    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(request, redirect)
  })

  it.each([
    ['https://localhost:3000', 'https://localhost:3000/buy/name', 'localhost:3047'],
    ['https://localhost:1234', 'https://localhost:1234/example/test/redirect', 'notsamehost:1234'],
    ['https://testserver-example-fish', 'https://testserver-example-fish/buy/renew/identify', 'hdfhdskfhs-ghj-vgjh'],
    [
      'https://get-a-fishing-licence.gov.uk/buy/licence-for',
      'https://some.shady.host/not/where/we/should/go',
      'get-a-fishing-licence.gov.uk'
    ]
  ])('redirects to /buy if the HTTP_REFERER host does not match the host of the current page', async (origin, referer, host) => {
    const payload = { analyticsResponse: 'accept' }
    const headers = { origin, referer }
    const request = generateRequestMock(payload, 'analytics', headers, host)
    const responseToolkit = generateResponseToolkitMock()

    await analyticsHandler(request, responseToolkit)

    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(request, '/buy')
  })

  it('selected not true and response is accept sets selected to true and acceptTracking to true', async () => {
    const payload = { analyticsResponse: 'accept' }
    const request = generateRequestMock(payload, 'analytics')

    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.selected]: true, [ANALYTICS.acceptTracking]: true }))
  })

  it('selected not true and response is reject sets selected to true and acceptTracking to false', async () => {
    const payload = { analyticsResponse: 'reject' }
    const request = generateRequestMock(payload, 'analytics')

    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(
      expect.objectContaining({ [ANALYTICS.selected]: true, [ANALYTICS.acceptTracking]: false })
    )
  })

  it('selected is true sets seenMessage to true', async () => {
    const analytics = { [ANALYTICS.selected]: true }
    const request = generateRequestMock('payload', analytics)

    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.seenMessage]: true }))
  })

  const mockAnalyticsSet = jest.fn()

  const generateRequestMock = (
    payload,
    analytics,
    headers = { origin: 'http://host/current/page', referer: 'http://host/previous/page' },
    host = 'host'
  ) => ({
    payload,
    url: {
      host,
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
    headers
  })

  const generateResponseToolkitMock = () => ({
    redirectWithLanguageCode: jest.fn()
  })
})
