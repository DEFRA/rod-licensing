import { ANALYTICS } from '../../constants.js'
import analyticsHandler, { trackGTM } from '../analytics-handler.js'
import db from 'debug'
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:analytics-handler')]

jest.mock('../../constants', () => ({
  ANALYTICS: {
    selected: 'selected',
    acceptTracking: 'accepted-tracking',
    seenMessage: 'seen-message'
  }
}))

jest.mock('debug', () => jest.fn(() => jest.fn()))

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

    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(redirect)
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

    expect(responseToolkit.redirectWithLanguageCode).toHaveBeenCalledWith('/buy')
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

  it('selected not true and response is null, then does not update the settings', async () => {
    const payload = { analyticsResponse: null }
    const request = generateRequestMock(payload, 'analytics')

    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).not.toHaveBeenCalled()
  })

  it('selected is true sets seenMessage to true', async () => {
    const analytics = { [ANALYTICS.selected]: true }
    const request = generateRequestMock('payload', analytics)

    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.seenMessage]: true }))
  })

  it('payload is empty, then does not update the settings', async () => {
    const payload = {}
    const request = generateRequestMock(payload, 'analytics')

    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).not.toHaveBeenCalled()
  })

  describe('trackGTM', () => {
    it.each([
      [true, true],
      [false, false]
    ])('when acceptedTracking property equals %s, trackGTM should return %s', async (tracking, expectedResult) => {
      const analytics = {
        [ANALYTICS.acceptTracking]: tracking
      }
      const result = await trackGTM(generateRequestMock('payload', analytics))

      expect(result).toBe(expectedResult)
    })

    it.each([
      [true, false, 'Session is being tracked'],
      [false, false, 'Session is not being tracked'],
      [true, false, 'Session is being tracked'],
      [false, true, 'Session is not being tracked for current page']
    ])(
      'when tracking is %s, GTM container Id has value, ENABLE_ANALYTICS_OPT_IN_DEBUGGING is true and pageOmitted is %s, trackGTM returns %s',
      async (tracking, skip, expectedResult) => {
        const analytics = {
          [ANALYTICS.acceptTracking]: tracking,
          [ANALYTICS.omitPageFromAnalytics]: skip
        }
        process.env.GTM_CONTAINER_ID = 'ABC123  '
        process.env.ENABLE_ANALYTICS_OPT_IN_DEBUGGING = true

        await trackGTM(generateRequestMock('payload', analytics))

        expect(debug).toHaveBeenCalledWith(expectedResult)
      }
    )

    it('debug isnt called if ENABLE_ANALYTICS_OPT_IN_DEBUGGING is set to false', async () => {
      const analytics = {
        [ANALYTICS.acceptTracking]: true
      }
      process.env.ENABLE_ANALYTICS_OPT_IN_DEBUGGING = false

      await trackGTM(generateRequestMock('payload', analytics))

      expect(debug).toBeCalledTimes(0)
    })

    it('debug isnt called if GTM_CONTAINER_ID is undefined', async () => {
      const analytics = {
        [ANALYTICS.acceptTracking]: true
      }
      process.env.ENABLE_ANALYTICS_OPT_IN_DEBUGGING = 'true'
      delete process.env.GTM_CONTAINER_ID

      await trackGTM(generateRequestMock('payload', analytics))

      expect(debug).toBeCalledTimes(0)
    })
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
