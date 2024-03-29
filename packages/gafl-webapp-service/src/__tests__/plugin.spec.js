import { getPlugins } from '../plugins'
import { ANALYTICS } from '../constants.js'
import { trackAnalyticsAccepted, getAnalyticsSessionId, pageOmitted } from '../handlers/analytics-handler.js'
import db from 'debug'

jest.mock('../constants', () => ({
  ANALYTICS: {
    acceptTracking: 'you-may-watch-me',
    seenMessage: 'seen-it',
    pageAnalyticsOmitted: 'ignored-page'
  },
  CommonResults: {
    OK: 'ok'
  },
  ShowDigitalLicencePages: {
    YES: 'show-digital-licence-yes'
  }
}))

jest.mock('../handlers/analytics-handler.js', () => ({
  pageOmitted: jest.fn(() => false),
  trackAnalyticsAccepted: jest.fn(() => true),
  getAnalyticsSessionId: jest.fn(() => '123')
}))
jest.mock('../server.js', () => ({
  getCsrfTokenCookieName: jest.fn()
}))
jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:plugin')]

describe('plugins', () => {
  const findPlugin = (pluginArray, pluginName) => pluginArray.find(plugin => plugin?.plugin?.plugin?.name === pluginName)
  const findPlugins = (pluginArray, pluginName) => pluginArray.find(plugin => plugin?.plugin?.plugin?.pkg?.name === pluginName)

  describe('initialiseHapiI18nPlugin', () => {
    it.each([
      [['en'], undefined, undefined],
      [['en'], undefined, false],
      [['en'], undefined, 'false'],
      [['en', 'cy'], 'lang', true],
      [['en', 'cy'], 'lang', 'true']
    ])(
      'should return the locale as %s and queryParameter as %s, if SHOW_WELSH_CONTENT is %s',
      async (expectedLocale, expectedQueryParamter, showWelshContent) => {
        process.env.SHOW_WELSH_CONTENT = showWelshContent
        const pluginArray = getPlugins()
        const hapI18nPlugin = findPlugin(pluginArray, 'hapi-i18n')
        expect(hapI18nPlugin.options.locales).toStrictEqual(expectedLocale)
        expect(hapI18nPlugin.options.queryParameter).toBe(expectedQueryParamter)
      }
    )
  })

  describe('trackAnalytics', () => {
    const generateRequestMock = (analytics = {}) => ({
      cache: jest.fn(() => ({
        hasSession: () => true,
        helpers: {
          analytics: {
            get: jest.fn(() => analytics)
          }
        }
      }))
    })

    beforeEach(jest.clearAllMocks)

    const pluginArray = getPlugins()
    const hapiGapiPlugin = findPlugins(pluginArray, '@defra/hapi-gapi')

    it.each([
      [true, true],
      [false, false]
    ])('when acceptedTracking property equals %s, trackAnalytics should return %s', async (tracking, expectedResult) => {
      const analytics = {
        [ANALYTICS.acceptTracking]: tracking
      }
      trackAnalyticsAccepted.mockReturnValueOnce(tracking)

      const result = await hapiGapiPlugin.options.trackAnalytics(generateRequestMock(analytics))

      expect(result).toBe(expectedResult)
    })

    it.each([
      [true, 'session_id_example', 'Session is being tracked for: session_id_example', false],
      [false, 'testing_session_id', 'Session is not being tracked for: testing_session_id', false],
      [true, 'example_session_id', 'Session is being tracked for: example_session_id', false],
      [false, 'test_session_id', 'Session is not tracking current page for: test_session_id', true]
    ])(
      'when tracking is %s it logs an ID of %s and %s and sets ENABLE_ANALYTICS_OPT_IN_DEBUGGING to true when pageOmitted returns %s',
      async (tracking, id, expectedResult, skip) => {
        const analytics = {
          [ANALYTICS.acceptTracking]: tracking,
          [ANALYTICS.omitPageFromAnalytics]: skip
        }
        process.env.ENABLE_ANALYTICS_OPT_IN_DEBUGGING = true

        trackAnalyticsAccepted.mockReturnValueOnce(tracking)
        getAnalyticsSessionId.mockReturnValueOnce(id)
        pageOmitted.mockReturnValueOnce(skip)

        await hapiGapiPlugin.options.trackAnalytics(generateRequestMock(analytics))

        expect(debug).toHaveBeenCalledWith(expectedResult)
      }
    )

    it('debug isnt called if ENABLE_ANALYTICS_OPT_IN_DEBUGGING is set to false', async () => {
      const analytics = {
        [ANALYTICS.acceptTracking]: true
      }
      process.env.ENABLE_ANALYTICS_OPT_IN_DEBUGGING = false

      await hapiGapiPlugin.options.trackAnalytics(generateRequestMock(analytics))

      expect(debug).toBeCalledTimes(0)
    })
  })
})
