import { ANALYTICS } from '../../constants.js'
import analyticsHandlder from '../analytics-handler.js'

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

  it('redirects to /buy', async () => {
    const payload = {
      analyticsResponse: 'accept'
    }
    const request = generateRequestMock(payload)
    const responseToolkit = generateResponseToolkitMock()
    await analyticsHandlder(request, responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith('/buy')
  })

  it('selected not true and response is accept sets selected to true and acceptTracking to true', async () => {
    const payload = {
      analyticsResponse: 'accept'
    }

    const request = generateRequestMock(payload)
    await analyticsHandlder(request, generateResponseToolkitMock())
    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.selected]: true, [ANALYTICS.acceptTracking]: true }))
  })

  it('selected not true and response is reject sets selected to true and acceptTracking to false', async () => {
    const payload = {
      analyticsResponse: 'reject'
    }
    const request = generateRequestMock(payload)
    await analyticsHandlder(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.selected]: true, [ANALYTICS.acceptTracking]: false }))
  })

  it('selected is true sets seenMessage to true', async () => {
    const analytics = {
      [ANALYTICS.selected]: true
    }

    const request = generateRequestMock('payload', analytics)
    await analyticsHandlder(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.seenMessage]: true }))
  })

  const mockAnalyticsSet = jest.fn()

  const generateRequestMock = (payload, analytics = {}) => ({
    payload,
    cache: jest.fn(() => ({
      helpers: {
        analytics: {
          get: jest.fn(() => analytics),
          set: mockAnalyticsSet
        }
      }
    }))
  })

  const generateResponseToolkitMock = () => ({
    redirect: jest.fn()
  })
})
