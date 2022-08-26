import { getPlugins } from '../plugins'
import { ANALYTICS } from '../constants.js'
import { checkAnalytics } from '../handlers/analytics-handler.js'

jest.mock('../constants', () => ({
  ANALYTICS: {
    acceptTracking: 'accepted-tracking'
  },
  CommonResults: {
    OK: 'ok'
  },
  ShowDigitalLicencePages: {
    YES: 'show-digital-licence-yes'
  }
}))

jest.mock('..handlers/analytics-handler.js')

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

  describe('initialiseHapiGapiPlugin', () => {
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
    ])('trackAnalytics to be set to value of checkAnalytics', async (tracking, expectedResult) => {
      const analytics = {
        [ANALYTICS.acceptTracking]: tracking
      }
      checkAnalytics.mockReturnValueOnce(tracking)

      const result = await hapiGapiPlugin.options.trackAnalytics(generateRequestMock(analytics))

      expect(result).toBe(expectedResult)
    })
  })
})
