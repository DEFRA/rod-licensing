import uri, { CONTROLLER, RECURRING_TERMS_CONDITIONS } from '../../uri.js'
import miscRoutes from '../misc-routes.js'
import constants from '../../constants.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'
import { welshEnabledAndApplied } from '../../processors/page-language-helper.js'

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
jest.mock('../../processors/page-language-helper.js')

describe('guidance page handlers', () => {
  const cookiesPageHandler = miscRoutes.find(r => r.path === uri.COOKIES.uri).handler
  const accessibilityPageHandler = miscRoutes.find(r => r.path === uri.ACCESSIBILITY_STATEMENT.uri).handler
  const privacyPolicyPageHandler = miscRoutes.find(r => r.path === uri.PRIVACY_POLICY.uri).handler
  const refundPolicyPageHandler = miscRoutes.find(r => r.path === uri.REFUND_POLICY.uri).handler
  const osTermsPageHandler = miscRoutes.find(r => r.path === uri.OS_TERMS.uri).handler
  const newPricesPageHandler = miscRoutes.find(r => r.path === uri.NEW_PRICES.uri).handler
  const rpTermsConditionsHandler = miscRoutes.find(r => r.path === uri.RECURRING_TERMS_CONDITIONS.uri).handler

  describe('cookies page handler', () => {
    const processEnv = process.env
    process.env.GTM_CONTAINER_ID = 'GTM-000000'

    beforeEach(jest.resetAllMocks)
    afterEach(() => {
      process.env = processEnv
      process.env.GTM_CONTAINER_ID = 'GTM-000000'
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

  it('New prices page handler provides expected data for new prices page', async () => {
    const catalog = Symbol('catalog')
    const mockUri = Symbol('Back')
    addLanguageCodeToUri.mockReturnValueOnce(mockUri)
    const mockRequest = getMockRequest({ locale: 'this-locale', locales: ['this-locale', 'that-locale'], catalog })
    const mockToolkit = getMockToolkit()

    await newPricesPageHandler(mockRequest, mockToolkit)

    expect(mockToolkit.view).toHaveBeenCalledWith(uri.NEW_PRICES.page, {
      altLang: ['that-locale'],
      gtmContainerId: 'GTM-000000',
      mssgs: catalog,
      uri: {
        back: mockUri
      }
    })
  })

  it('recurring payment terms and conditions page handler provides expected data for recurring payments terms and conditions page', async () => {
    const catalog = Symbol('catalog')
    const mockUri = Symbol('terms')
    const welshEnabled = Symbol('enabled')
    addLanguageCodeToUri.mockReturnValue(mockUri)
    welshEnabledAndApplied.mockReturnValueOnce(welshEnabled)
    const mockRequest = getMockRequest({ locale: 'this-locale', locales: ['this-locale', 'that-locale'], catalog })
    const mockToolkit = getMockToolkit()

    await rpTermsConditionsHandler(mockRequest, mockToolkit)

    expect(mockToolkit.view).toHaveBeenCalledWith(uri.RECURRING_TERMS_CONDITIONS.page, {
      altLang: ['that-locale'],
      gtmContainerId: 'GTM-000000',
      pageLanguageSetToWelsh: welshEnabled,
      mssgs: catalog,
      uri: {
        privacy: mockUri,
        refund: mockUri
      }
    })
  })

  it('privacy policy page handler provides expected data for privacy page', async () => {
    const catalog = Symbol('catalog')
    const mockUri = Symbol('terms')
    const welshEnabled = Symbol('enabled')
    addLanguageCodeToUri.mockReturnValue(mockUri)
    welshEnabledAndApplied.mockReturnValueOnce(welshEnabled)
    const mockRequest = getMockRequest({ locale: 'this-locale', locales: ['this-locale', 'that-locale'], catalog })
    const mockToolkit = getMockToolkit()

    await privacyPolicyPageHandler(mockRequest, mockToolkit)

    expect(mockToolkit.view).toHaveBeenCalledWith(uri.PRIVACY_POLICY.page, {
      altLang: ['that-locale'],
      gtmContainerId: 'GTM-000000',
      pageLanguageSetToWelsh: welshEnabled,
      mssgs: catalog,
      uri: {
        back: mockUri,
        cookies: mockUri
      }
    })
  })

  describe.each([
    { pageHandler: accessibilityPageHandler, handlerName: 'Accessibility' },
    { pageHandler: refundPolicyPageHandler, handlerName: 'Refund policy' },
    { pageHandler: cookiesPageHandler, handlerName: 'Cookies' }
  ])('back button tests for $handlerName page', ({ pageHandler }) => {
    beforeEach(jest.resetAllMocks)
    it.each([[CONTROLLER.uri], [RECURRING_TERMS_CONDITIONS.uri]])(
      'addLanguageCodeToUri is called with %s when referrer is %s',
      async referrer => {
        const toolkit = getMockToolkit()
        const request = getMockRequest({ locale: 'this-locale', locales: ['this-locale', 'that-locale'], catalog: 'catalog' }, referrer)

        await pageHandler(request, toolkit)

        expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, referrer)
      }
    )

    it.each([[CONTROLLER.uri], [RECURRING_TERMS_CONDITIONS.uri]])(
      'back button should be set to %s when referrer is same value',
      async referrer => {
        const toolkit = getMockToolkit()
        const request = getMockRequest({ locale: 'this-locale', locales: ['this-locale', 'that-locale'], catalog: 'catalog' }, referrer)
        addLanguageCodeToUri.mockImplementation((_request, uri) => uri)

        await pageHandler(request, toolkit)

        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            uri: expect.objectContaining({
              back: referrer
            })
          })
        )
      }
    )
  })

  describe.each([
    { pageHandler: cookiesPageHandler, handlerName: 'Cookies' },
    { pageHandler: accessibilityPageHandler, handlerName: 'Accessibility' },
    { pageHandler: privacyPolicyPageHandler, handlerName: 'Privacy policy' },
    { pageHandler: refundPolicyPageHandler, handlerName: 'Refund policy' },
    { pageHandler: osTermsPageHandler, handlerName: 'OS Terms' },
    { pageHandler: newPricesPageHandler, handlerName: 'New Prices Page Handler' }
  ])('language code tests for $handlerName page', ({ pageHandler }) => {
    beforeEach(jest.resetAllMocks)
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
      addLanguageCodeToUri.mockReturnValue(backUrl)

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

    it('returns the value of welshEnabledAndApplied for pageLanguageSetToWelsh', async () => {
      const toolkit = getMockToolkit()
      const request = getMockRequest()
      const expectedValue = Symbol('expected')
      welshEnabledAndApplied.mockReturnValueOnce(expectedValue)

      await pageHandler(request, toolkit)

      expect(toolkit.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          pageLanguageSetToWelsh: expectedValue
        })
      )
    })
  })

  const getMockRequest = (i18nValues, referer) => {
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
        search: ''
      },
      headers: {
        referer
      }
    }
  }

  const getMockToolkit = () => ({
    view: jest.fn()
  })
})
