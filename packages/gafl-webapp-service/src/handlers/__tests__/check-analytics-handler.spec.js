import { ANALYTICS } from '../../constants.js'
import { checkAnalytics } from '../analytics-handler.js'

jest.mock('../../constants', () => ({
  ANALYTICS: {
    selected: 'selected',
    acceptTracking: 'accepted-tracking',
    rejectTracking: 'rejected-tracking',
    seenMessage: 'seen-message'
  }
}))
describe('checkAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([[true], [false]])(
    'returns value of [ANALYTICS.acceptTracking]', async acceptTracking => {
      const analytics = {
        [ANALYTICS.acceptTracking]: acceptTracking
      }
      const result = await checkAnalytics(generateRequestMock(analytics))
      expect(result).toEqual(acceptTracking)
    })

  const generateRequestMock = (analytics = {}) => ({
    cache: jest.fn(() => ({
      helpers: {
        analytics: {
          get: jest.fn(() => analytics),
          set: jest.fn()
        }
      }
    }))
  })
})
