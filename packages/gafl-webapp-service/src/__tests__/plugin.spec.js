import { getPlugins } from '../plugins'

jest.mock('../constants', () => ({
  CommonResults: {
    OK: 'ok'
  },
  ShowDigitalLicencePages: {
    YES: 'show-digital-licence-yes'
  }
}))

jest.mock('../server.js', () => ({
  getCsrfTokenCookieName: jest.fn()
}))
jest.mock('debug', () => jest.fn(() => jest.fn()))

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
})
