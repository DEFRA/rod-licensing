import { getPlugins } from '../plugins'

describe('plugins', () => {
  const findPlugin = (pluginArray, pluginName) => pluginArray.find(plugin => plugin?.plugin?.plugin?.name === pluginName)

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

  describe('userAgreedToTracking', () => {
    beforeEach(jest.clearAllMocks)
    it('AGREE_ANALYTICS set to false so initialiseHapiGapiPlugin is not called', async () => {
      process.env.AGREE_ANALYTICS = false

      const pluginArray = getPlugins()
      const hapiGapiPlugin = pluginArray[7]

      expect(hapiGapiPlugin.options.propertySettings).toBeUndefined()
    })

    it('AGREE_ANALYTICS set to true so initialiseHapiGapiPlugin is called', async () => {
      process.env.AGREE_ANALYTICS = true
      process.env.ANALYTICS_PRIMARY_PROPERTY = true
      process.env.ANALYTICS_XGOV_PROPERTY = true

      const pluginArray = getPlugins()
      const hapiGapiPlugin = pluginArray[7]

      expect(hapiGapiPlugin.options.propertySettings).toBeDefined()
    })

    it.each([
      ['development', true, 'Session is being tracked.'],
      ['test', true, 'Session is being tracked.'],
      ['development', false, 'Session is not being tracked.'],
      ['test', false, 'Session is not being tracked.']
    ])('log matches whether session is being tracked if dev/test environment', async (env, analytics, log) => {
      process.env.NODE_ENV = env
      process.env.AGREE_ANALYTICS = analytics
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())

      getPlugins()

      expect(consoleLogSpy).toHaveBeenCalledWith(log)
    })
  })
})
