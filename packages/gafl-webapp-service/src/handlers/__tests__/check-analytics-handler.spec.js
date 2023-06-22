import { ANALYTICS } from '../../constants.js'
import { CacheError } from '../../session-cache/cache-manager.js'
import { checkAnalytics, getAnalyticsSessionId, checkPage } from '../analytics-handler.js'

jest.mock('../../constants', () => ({
  ANALYTICS: {
    selected: 'selected',
    acceptTracking: 'accepted-tracking',
    seenMessage: 'seen-message',
    skipPage: 'skip-page'
  }
}))

describe('checkAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each`
    desc                                                                                                                  | analytics                                                           | page     | trackingResult
    ${'analytics has value of accept tracking as true, page should not be skipped then return of checkAnalytics is true'} | ${{ [ANALYTICS.acceptTracking]: true }}                             | ${false} | ${true}
    ${'analytics has value of accept tracking as true, page should be skipped then return of checkAnalytics is false'}    | ${{ [ANALYTICS.acceptTracking]: true, [ANALYTICS.skipPage]: true }} | ${true}  | ${false}
    ${'analytics has value but accept tracking is false so return of checkAnalytics is false'}                            | ${{ [ANALYTICS.acceptTracking]: false }}                            | ${false} | ${false}
  `('when $desc', async ({ analytics, page, trackingResult }) => {
    const result = await checkAnalytics(generateRequestMock(analytics), page)

    expect(result).toBe(trackingResult)
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

describe('checkPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    [true, true],
    [false, false]
  ])('when analytics skip page is %s, returns %s', async (skipPage, expected) => {
    const analytics = { [ANALYTICS.skipPage]: skipPage }
    const result = await checkPage(generateRequestMock(analytics))

    expect(result).toBe(expected)
  })

  it('empty session cache returns false', async () => {
    const result = await checkPage(
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

const generateRequestMock = (analytics, getId = () => {}) => ({
  cache: jest.fn(() => ({
    getId: jest.fn(getId),
    helpers: {
      analytics: {
        get: jest.fn(() => analytics)
      }
    }
  }))
})
