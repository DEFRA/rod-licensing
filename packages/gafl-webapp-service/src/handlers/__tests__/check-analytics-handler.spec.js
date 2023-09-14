import { ANALYTICS } from '../../constants.js'
import { CacheError } from '../../session-cache/cache-manager.js'
import { trackAnalyticsAccepted, getAnalyticsSessionId, pageOmitted } from '../analytics-handler.js'

jest.mock('../../constants', () => ({
  ANALYTICS: {
    selected: 'chosen-one',
    acceptTracking: 'you-may-watch-me',
    seenMessage: 'seen-it',
    pageSkipped: 'ignored-page'
  }
}))

describe('trackAnalyticsAccepted', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each`
    desc                                                                                                   | analytics                                                                       | page     | trackingResult
    ${'of accept tracking as true, page should not be skipped then return trackAnalyticsAccepted as true'} | ${{ [ANALYTICS.acceptTracking]: true }}                                         | ${false} | ${true}
    ${'of accept tracking as true, page should be skipped then return trackAnalyticsAccepted as false'}    | ${{ [ANALYTICS.acceptTracking]: true, [ANALYTICS.pageAnalyticsOmitted]: true }} | ${true}  | ${false}
    ${'but accept tracking is false so return trackAnalyticsAccepted as false'}                            | ${{ [ANALYTICS.acceptTracking]: false }}                                        | ${false} | ${false}
  `('when analytics has a value $desc', async ({ analytics, page, trackingResult }) => {
    const result = await trackAnalyticsAccepted(generateRequestMock(analytics), page)

    expect(result).toBe(trackingResult)
  })

  it('empty session cache returns false', async () => {
    const result = await trackAnalyticsAccepted(
      generateRequestMock(() => {
        throw new CacheError()
      })
    )
    expect(result).toEqual(false)
  })
})

describe('pageOmitted', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    [true, true],
    [false, false]
  ])('when analytics omitPageFromAnalytics property is %s, pageAnalyticsOmitted returns %s', async (skipPage, expected) => {
    const analytics = { [ANALYTICS.omitPageFromAnalytics]: skipPage }
    const result = await pageOmitted(generateRequestMock(analytics))

    expect(result).toBe(expected)
  })

  it('empty session cache returns false', async () => {
    const result = await pageOmitted(
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
