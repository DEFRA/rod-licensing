import { ANALYTICS } from '../../constants.js'
import { CacheError } from '../../session-cache/cache-manager.js'
import { checkAnalytics, getAnalyticsSessionId, skipPage } from '../analytics-handler.js'

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
  desc                                                                                                                         | analytics                                                                                           | trackingResult
  ${'analytics has value including accept tracking as true, page should not be skipped then return of checkAnalytics is true'} | ${{ [ANALYTICS.acceptTracking]: true, [ANALYTICS.skipPage]: false, [ANALYTICS.seenMessage]: true }} | ${true}
  ${'analytics has value including accept tracking as true, page should be skipped then return of checkAnalytics is false'}    | ${{ [ANALYTICS.acceptTracking]: true, [ANALYTICS.skipPage]: true, [ANALYTICS.seenMessage]: true }}  | ${false}
  ${'analytics has no value so return of checkAnalytics is false'}                                                             | ${undefined}                                                                                        | ${false}
  ${'analytics has value but accept tracking is false so return of checkAnalytics is false'}                                   | ${{ [ANALYTICS.acceptTracking]: false }}                                                            | ${false}
  `('when $desc', async ({ analytics, trackingResult }) => {
    const result = await checkAnalytics(generateRequestMock(analytics))

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

describe('skipPage', () => {
  it.each`
  desc                                                                       | analytics                                                                  | skipResult
  ${'user has seen banner and next page view tracking has not been skipped'} | ${{ [ANALYTICS.seenMessage]: true, [ANALYTICS.skipPage]: undefined }}      | ${true}
  ${'user has seen banner and next page view tracking has been skipped'}     | ${{ [ANALYTICS.seenMessage]: true, [ANALYTICS.skipPage]: true }}           | ${false}
  ${'user has not seen banner'}                                              | ${{ [ANALYTICS.seenMessage]: false, [ANALYTICS.skipPage]: undefined }}     | ${false}
  `('when $desc', async ({ analytics, skipResult }) => {
    const result = await skipPage(generateRequestMock(analytics))

    expect(result).toBe(skipResult)
  })

  it('user has seen banner and next page view tracking has not been skipped so analytics is updated with page view as skipped', async () => {
    await skipPage(generateRequestMock({ [ANALYTICS.seenMessage]: true, [ANALYTICS.skipPage]: false }))
    expect(mockAnalyticsSet).toHaveBeenCalledWith({ [ANALYTICS.skipPage]: true })
  })
})

const mockAnalyticsSet = jest.fn()

const generateRequestMock = (analytics, getId = () => {}) => ({
  cache: jest.fn(() => ({
    getId: jest.fn(getId),
    helpers: {
      analytics: {
        get: jest.fn(() => analytics),
        set: mockAnalyticsSet
      }
    }
  }))
})
