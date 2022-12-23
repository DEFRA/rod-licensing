import newSessionHandler from '../new-session-handler.js'
import { CONTROLLER } from '../../uri.js'
import { initialiseAnalyticsSessionData } from '../../processors/analytics.js'

jest.mock('../../processors/analytics.js')

describe('New session handler', () => {
  const getMockRequest = mockStatus => ({
    cache: () => ({
      initialize: () => ({}),
      helpers: {
        status: {
          get: async () => mockStatus
        }
      }
    })
  })

  const getRequestToolkit = () => ({
    redirectWithLanguageCode: jest.fn()
  })

  it('calls initialiseAnalyticsSessionData with the correct arguments', async () => {
    const mockCacheStatus = Symbol('mockCacheStatus')
    const mockRequest = getMockRequest(mockCacheStatus)
    const mockRequestToolkit = getRequestToolkit()

    await newSessionHandler(mockRequest, mockRequestToolkit)
    expect(initialiseAnalyticsSessionData).toHaveBeenCalledWith(mockRequest, mockCacheStatus)
  })

  it('redirects to the controller uri', async () => {
    const mockRequest = getMockRequest()
    const mockRequestToolkit = getRequestToolkit()

    await newSessionHandler(mockRequest, mockRequestToolkit)
    expect(mockRequestToolkit.redirectWithLanguageCode).toHaveBeenCalledWith(mockRequest, CONTROLLER.uri)
  })
})
