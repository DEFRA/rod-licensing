import uri from '../../uri.js'
import miscRoutes from '../misc-routes.js'
import constants from '../../constants.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'

jest.mock('../../uri.js', () => ({
  ...jest.requireActual('../../uri.js'),
  CONTROLLER: {
    uri: 'controller.uri'
  },
  COOKIES: {
    uri: 'cookies.uri',
    page: 'biscuits'
  }
}))

jest.mock('../../constants.js', () => ({
  ...jest.requireActual('../../constants.js'),
  CSRF_TOKEN_COOKIE_NAME_DEFAULT: 'CSRF_TOKEN_COOKIE_NAME_DEFAULT'
}))

jest.mock('../../processors/uri-helper.js')

describe('guidance page handlers', () => {
  const cookiesPageHandler = miscRoutes.find(r => r.path === uri.COOKIES.uri).handler
  const accessibilityPageHandler = miscRoutes.find(r => r.path === uri.ACCESSIBILITY_STATEMENT.uri).handler
  const privacyPolicyPageHandler = miscRoutes.find(r => r.path === uri.PRIVACY_POLICY.uri).handler
  const refundPolicyPageHandler = miscRoutes.find(r => r.path === uri.REFUND_POLICY.uri).handler
  const osTermsPageHandler = miscRoutes.find(r => r.path === uri.OS_TERMS.uri).handler

  describe('cookies page handler', () => {
    const processEnv = process.env

    beforeEach(jest.resetAllMocks)
    afterEach(() => {
      process.env = processEnv
    })

    it('only calls toolkit view function once', () => {
      const toolkit = getMockToolkit()
      cookiesPageHandler(getMockRequest(), toolkit)
      expect(toolkit.view).toHaveBeenCalledTimes(1)
    })

    it.each([['cookies.policy.page'], ['page.url'], ['policy-for-cookies']])('sets cookie page', cookiesPage => {
      const toolkit = getMockToolkit()
      uri.COOKIES.page = cookiesPage
      cookiesPageHandler(getMockRequest(), toolkit)
      expect(toolkit.view).toHaveBeenCalledWith(cookiesPage, expect.any(Object))
    })

    it.each([['csrf_token_cookie_name'], ['any_name'], ['token_cookie']])(
      'sets cookie.csrf to match process.env.CSRF_TOKEN_COOKIE_NAME',
      csrf => {
        process.env.CSRF_TOKEN_COOKIE_NAME = csrf
        const toolkit = getMockToolkit()
        cookiesPageHandler(getMockRequest(), toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            cookie: expect.objectContaining({
              csrf
            })
          })
        )
      }
    )

    it.each([['default cookie name'], ['csrf-token-cookie-name-default']])(
      "sets cookie.csrf to default if process.env.CSRF_TOKEN_COOKIE_NAME isn't provided",
      defaultName => {
        delete process.env.CSRF_TOKEN_COOKIE_NAME
        constants.CSRF_TOKEN_COOKIE_NAME_DEFAULT = defaultName
        const toolkit = getMockToolkit()
        cookiesPageHandler(getMockRequest(), toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            cookie: expect.objectContaining({
              csrf: defaultName
            })
          })
        )
      }
    )

    it.each([['session-cookie-name'], ['sen'], ['session.cookie.name']])(
      'sets cookie.sess to match process.env.SESSION_COOKIE_NAME',
      sessionCookieName => {
        process.env.SESSION_COOKIE_NAME = sessionCookieName
        const toolkit = getMockToolkit()
        cookiesPageHandler(getMockRequest(), toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            cookie: expect.objectContaining({
              sess: sessionCookieName
            })
          })
        )
      }
    )

    it.each([['default session cookie name'], ['session-cookie-name-default']])(
      "sets cookie.sess to default if process.env.SESSION_COOKIE_NAME isn't provided",
      defaultName => {
        delete process.env.SESSION_COOKIE_NAME
        constants.SESSION_COOKIE_NAME_DEFAULT = defaultName
        const toolkit = getMockToolkit()
        cookiesPageHandler(getMockRequest(), toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            cookie: expect.objectContaining({
              sess: defaultName
            })
          })
        )
      }
    )

    it.each([['alb cookie name'], ['alb-cookie-name-default']])(
      "sets cookie.sess to default if process.env.SESSION_COOKIE_NAME isn't provided",
      defaultName => {
        constants.ALB_COOKIE_NAME = defaultName
        const toolkit = getMockToolkit()
        cookiesPageHandler(getMockRequest(), toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            cookie: expect.objectContaining({
              alb: defaultName
            })
          })
        )
      }
    )

    it.each([['albcors cookie name'], ['alb-cors-cookie-name-default']])(
      "sets cookie.sess to default if process.env.SESSION_COOKIE_NAME isn't provided",
      defaultName => {
        constants.ALBCORS_COOKIE_NAME = defaultName
        const toolkit = getMockToolkit()
        cookiesPageHandler(getMockRequest(), toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            cookie: expect.objectContaining({
              albcors: defaultName
            })
          })
        )
      }
    )

    it.each([
      [['kl', 'vu'], 'kl', 'vu'],
      [['si', 'we'], 'we', 'si']
    ])('sets altLang to be other item in two-item language array', (locales, locale, altLang) => {
      const request = getMockRequest({ locales, locale })
      const toolkit = getMockToolkit()
      cookiesPageHandler(request, toolkit)
      expect(toolkit.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          altLang: [altLang]
        })
      )
    })

    it.each([[{ msg_header: 'header1', msg_body: 'body1' }], [{ msg_header: 'header2', msg_body: 'body2' }]])(
      'returns messages from catalog',
      catalog => {
        const request = getMockRequest({ catalog })
        const toolkit = getMockToolkit()
        cookiesPageHandler(request, toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            mssgs: catalog
          })
        )
      }
    )

    it.each([[Symbol('view-return')], [Symbol('view.return')]])('returns h.view return value', async viewReturn => {
      const toolkit = getMockToolkit()
      toolkit.view.mockReturnValue(viewReturn)
      const returned = await cookiesPageHandler(getMockRequest(), toolkit)
      expect(returned).toEqual(viewReturn)
    })
  })

  describe.each([
    { pageHandler: cookiesPageHandler, handlerName: 'Cookies' },
    { pageHandler: accessibilityPageHandler, handlerName: 'Accessibility' },
    { pageHandler: privacyPolicyPageHandler, handlerName: 'Privacy policy' },
    { pageHandler: refundPolicyPageHandler, handlerName: 'Refund policy' },
    { pageHandler: osTermsPageHandler, handlerName: 'OS Terms' }
  ])('language code tests for $handlerName page', ({ pageHandler }) => {
    it('uses addLanguageCodeToUri to get back url', async () => {
      const toolkit = getMockToolkit()
      const request = getMockRequest()

      await pageHandler(request, toolkit)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, uri.CONTROLLER.uri)
    })

    it('uses url generated by addLanguageCodeToUri for back url', async () => {
      const toolkit = getMockToolkit()
      const request = getMockRequest()
      const backUrl = Symbol('backUrl')
      addLanguageCodeToUri.mockReturnValueOnce(backUrl)

      await pageHandler(request, toolkit)

      expect(toolkit.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          uri: expect.objectContaining({
            back: backUrl
          })
        })
      )
    })
    // it.each([
    //   ['?lang=cy', '?lang=cy'],
    //   ['?other-data=abc123&lang=cy', '?lang=cy'],
    //   ['?misc-info=123&extra-rods=2&lang=cy&rhubarb-crumble=yes-please', '?lang=cy'],
    //   ['', ''],
    //   ['?other-data=bbb-111', ''],
    //   ['?misc-info=999&extra-rods=1&sprout-surprise=no-thanks', '']
    // ])('populates langCode on pageData with welsh language code, where necessary', async (search, langCode) => {
    //   const toolkit = getMockToolkit()
    //   await pageHandler(getMockRequest({}, search), toolkit)
    //   expect(toolkit.view).toHaveBeenCalledWith(
    //     expect.any(String),
    //     expect.objectContaining({
    //       langCode
    //     })
    //   )
    // })
  })

  const getMockRequest = (i18nValues, search = '') => {
    const { catalog, locales, locale } = {
      catalog: {},
      locales: [],
      locale: '',
      ...i18nValues
    }
    return {
      i18n: {
        getCatalog: () => catalog,
        getLocales: () => locales,
        getLocale: () => locale
      },
      url: {
        search
      }
    }
  }

  const getMockToolkit = () => ({
    view: jest.fn()
  })
})
