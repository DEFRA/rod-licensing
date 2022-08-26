import { ANALYTICS } from '../../constants.js'
import { CacheError } from '../../session-cache/cache-manager.js'
import { checkAnalytics, getAnalyticsSessionId } from '../analytics-handler.js'

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
    const analytics = () => ({
      [ANALYTICS.acceptTracking]: acceptTracking
    })
    const result = await checkAnalytics(generateRequestMock(analytics))
    expect(result).toEqual(trackingResult)
  })

  it('empty session cache returns false', async () => {
    const result = await checkAnalytics(
      generateRequestMock(() => {
        throw new CacheError()
      })
    )
    expect(result).toEqual(false)
  })
})

describe('getAnalyticsSessionId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([['session_id_example'], ['testing_session_id'], ['example_session_id']])('returns the value sessionId', async id => {
    const result = await getAnalyticsSessionId(
      generateRequestMock(
        () => null,
        () => id
      )
    )
    expect(result).toEqual(id)
  })

  it('empty session cache returns false', async () => {
    const result = await getAnalyticsSessionId(
      generateRequestMock(
        () => null,
        () => {
          throw new CacheError()
        }
      )
    )
    expect(result).toEqual(null)
  })
})

const generateRequestMock = (analytics = () => {}, getId = () => {}) => ({
  cache: jest.fn(() => ({
    getId: jest.fn(getId),
    helpers: {
      analytics: {
        get: jest.fn(analytics),
        set: jest.fn()
      }
    }
  }))
})
