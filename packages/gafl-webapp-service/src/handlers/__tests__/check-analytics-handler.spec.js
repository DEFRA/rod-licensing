import { ANALYTICS } from '../../constants.js'
import { checkAnalytics } from '../analytics-handler.js'

jest.mock('../../constants', () => ({
  ANALYTICS: {
    acceptTracking: 'accepted-tracking'
  }
}))
describe('checkAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    [true, true],
    [false, false],
    [undefined, false]
  ])('returns value of [ANALYTICS.acceptTracking]', async (acceptTracking, trackingResult) => {
    const analytics = {
      [ANALYTICS.acceptTracking]: acceptTracking
    }
    const result = await checkAnalytics(generateRequestMock(analytics))
    expect(result).toEqual(trackingResult)
  })

  it('empty session cache returns false', async () => {
    const result = await checkAnalytics({ cache: () => ({ hasSession: () => false }) })
    expect(result).toEqual(false)
  })

  const generateRequestMock = (analytics = {}) => ({
    cache: jest.fn(() => ({
      hasSession: () => true,
      helpers: {
        analytics: {
          get: jest.fn(() => analytics),
          set: jest.fn()
        }
      }
    }))
  })
})
