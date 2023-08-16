import { initialiseAnalyticsSessionData, getAffiliation } from '../analytics.js'
import db from 'debug'

jest.mock('debug', () => jest.fn(() => jest.fn()))

describe('initialiseAnalyticsSessionData', () => {
  const fakeCacheSetter = jest.fn()
  const fakeCacheDecorator = jest.fn(() => ({ helpers: { status: { set: fakeCacheSetter } } }))
  let fakeDebug, firstDbCall
  beforeAll(() => {
    ;[[firstDbCall]] = db.mock.calls
    fakeDebug = db.mock.results[0].value
    console.log('fakeDebug', fakeDebug)
  })
  beforeEach(jest.clearAllMocks)

  it('initialises debug', () => {
    expect(firstDbCall).toEqual('webapp:analytics-processor')
  })

  it.each([
    { _ga: 'GA1.2.1234567890.10234567890', gaClientId: '1234567890.10234567890' },
    { _ga: 'GA2.1-3.220027162.1602852296', gaClientId: '220027162.1602852296' },
    { _ga: '5c654e56-bd36-4ac9-b300-9a824b2bcf11', gaClientId: '9a824b2bcf11' },
    { _ga: 'a25c03b-31b0-4511-1b7e794e1d8', gaClientId: '1b7e794e1d8' }
  ])(
    'stores the ga client id from the query string on the session to support cross-domain tracking from the landing page',
    async ({ _ga, gaClientId }) => {
      const fakeRequest = {
        query: { _ga },
        cache: fakeCacheDecorator
      }
      await initialiseAnalyticsSessionData(fakeRequest)
      expect(fakeCacheSetter).toHaveBeenCalledWith(
        expect.objectContaining({
          gaClientId
        })
      )
    }
  )

  it.each(['!@£$%^&*()œ∑´®†¥¨^øåß∂ƒ©˙∆˚', '¡€#¢∞§¶•ªø^¨¥©˙∆˚˙©†ƒ®', '1$2$345$678', '1,2,345,678', '523510731_1602852296'])(
    'unexpected _ga formats fail gracefully',
    async _ga => {
      const fakeRequest = {
        query: { _ga },
        cache: fakeCacheDecorator
      }
      let err
      try {
        await initialiseAnalyticsSessionData(fakeRequest)
      } catch (e) {
        err = e
      }
      expect(err).toBeUndefined()
    }
  )

  it.each(['!@£$%^&*()œ∑´®†¥¨^øåß∂ƒ©˙∆˚', '¡€#¢∞§¶•ªø^¨¥©˙∆˚˙©†ƒ®', '1$2$345$678', '1,2,345,678', '523510731_1602852296'])(
    'unexpected _ga formats are logged',
    async _ga => {
      const fakeRequest = {
        query: { _ga },
        cache: fakeCacheDecorator
      }

      await initialiseAnalyticsSessionData(fakeRequest)
      expect(fakeDebug).toHaveBeenCalledWith(expect.stringContaining(_ga))
    }
  )

  it('retrieves the custom ga client id from the previous session and stores these on the new session', async () => {
    const fakeRequest = { cache: fakeCacheDecorator, query: {} }
    await initialiseAnalyticsSessionData(fakeRequest, { gaClientId: 'test123' })
    expect(fakeCacheSetter).toHaveBeenCalledWith(
      expect.objectContaining({
        gaClientId: 'test123'
      })
    )
  })
})

describe('affiliation transform', () => {
  it('returns expected value for web sales', () => {
    expect(getAffiliation('websales')).toBe('Get a fishing licence service - Web sales')
  })

  it('returns expected value for telesales', () => {
    expect(getAffiliation('telesales')).toBe('Get a fishing licence service - Telephone sales')
  })
})
