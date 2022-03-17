import { getPlugins } from '../plugins'

describe('plugins', () => {
  const findPlugin = (pluginArray, pluginName) => pluginArray.find(plugin => plugin?.plugin?.plugin?.name === pluginName)

  describe('initialiseHapiI18nPlugin', () => {
    it.each([
      [['en'], undefined],
      [['en'], false],
      [['en'], 'false'],
      [['en', 'cy'], true],
      [['en', 'cy'], 'true']
    ])('should return the local as %s if SHOW_WELSH_CONTENT is %s', async (expectedLocale, showWelshContent) => {
      process.env.SHOW_WELSH_CONTENT = showWelshContent
      const pluginArray = getPlugins()
      const hapI18nPlugin = findPlugin(pluginArray, 'hapi-i18n')
      expect(hapI18nPlugin.options.locales).toStrictEqual(expectedLocale)
    })
  })
})
