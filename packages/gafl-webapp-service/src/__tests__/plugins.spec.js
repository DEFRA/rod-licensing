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
  describe('initialiseHapiI18nPlugin', () => {
    it('should configure i18n for English and Welsh', () => {
      const hapI18nPlugin = getPlugins().find(plugin => plugin?.plugin?.plugin?.name === 'hapi-i18n')

      expect(hapI18nPlugin.options.locales).toStrictEqual(['en', 'cy'])
      expect(hapI18nPlugin.options.queryParameter).toBe('lang')
    })
  })

  describe('initialiseBlankiePlugin', () => {
    it('should return expecetd src details', async () => {
      const blankiePlugin = getPlugins().find(plugin => plugin?.plugin?.plugin?.pkg?.name === 'blankie')
      expect(blankiePlugin.options).toMatchSnapshot()
    })
  })
})
