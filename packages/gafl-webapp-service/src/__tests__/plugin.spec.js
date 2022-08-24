import { getPlugins } from '../plugins'
import { ANALYTICS } from '../constants.js'

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

    it('trackAnalytics to be set to true', async () => {
      const analytics = {
        [ANALYTICS.acceptTracking]: true
      }

      jest.mock('../handlers/analytics-handler.js', () => ({
        checkAnalytics: jest.fn(async () => true)
      }))

      const result = await hapiGapiPlugin.options.trackAnalytics(generateRequestMock(analytics))

      expect(result).toBe(true)
    })

    it('trackAnalytics to be set to false', async () => {
      const analytics = {
        [ANALYTICS.acceptTracking]: false
      }

      jest.mock('../handlers/analytics-handler.js', () => ({
        checkAnalytics: jest.fn(async () => false)
      }))

      const result = await hapiGapiPlugin.options.trackAnalytics(generateRequestMock(analytics))

      expect(result).toBe(false)
    })
  })
})
