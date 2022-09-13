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

  it('redirects to /buy', async () => {
    const payload = {
      analyticsResponse: 'accept'
    }
    const request = generateRequestMock(payload)
    const responseToolkit = generateResponseToolkitMock()
    await analyticsHandler(request, responseToolkit)
    expect(responseToolkit.redirect).toHaveBeenCalledWith(addLanguageCodeToUri(request, '/buy'))
  })

  it('get calls addLanguageCodeToUri with request and /buy', async () => {
    const buyUri = '/buy'
    const payload = {
      analyticsResponse: 'accept'
    }
    const responseToolkit = generateResponseToolkitMock()
    const request = generateRequestMock(payload)

    await analyticsHandler(request, responseToolkit)

    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, buyUri)
  })

  it('selected not true and response is accept sets selected to true and acceptTracking to true', async () => {
    const payload = {
      analyticsResponse: 'accept'
    }

    const request = generateRequestMock(payload)
    await analyticsHandler(request, generateResponseToolkitMock())
    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.selected]: true, [ANALYTICS.acceptTracking]: true }))
  })

  it('selected not true and response is reject sets selected to true and acceptTracking to false', async () => {
    const payload = {
      analyticsResponse: 'reject'
    }
    const request = generateRequestMock(payload)
    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(
      expect.objectContaining({ [ANALYTICS.selected]: true, [ANALYTICS.acceptTracking]: false })
    )
  })

  it('selected is true sets seenMessage to true', async () => {
    const analytics = {
      [ANALYTICS.selected]: true
    }

    const request = generateRequestMock('payload', analytics)
    await analyticsHandler(request, generateResponseToolkitMock())

    expect(mockAnalyticsSet).toHaveBeenCalledWith(expect.objectContaining({ [ANALYTICS.seenMessage]: true }))
  })

  const mockAnalyticsSet = jest.fn()

  const generateRequestMock = (payload, analytics = {}) => ({
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
    }))
  })

  const generateResponseToolkitMock = () => ({
    redirect: jest.fn()
  })
})
