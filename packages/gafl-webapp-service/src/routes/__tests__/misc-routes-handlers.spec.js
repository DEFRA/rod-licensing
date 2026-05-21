import uri, { CONTROLLER, RECURRING_TERMS_CONDITIONS } from '../../uri.js'
import miscRoutes from '../misc-routes.js'
import constants, { ANALYTICS } from '../../constants.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'
import { welshEnabledAndApplied } from '../../processors/page-language-helper.js'
import { checkAnalyticsCookiesPage } from '../../handlers/analytics-handler.js'

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
  CSRF_TOKEN_COOKIE_NAME_DEFAULT: 'CSRF_TOKEN_COOKIE_NAME_DEFAULT',
  ANALYTICS: {
    acceptTracking: 'accept'
  }
}))

jest.mock('../../processors/uri-helper.js')
jest.mock('../../processors/page-language-helper.js')
jest.mock('../../handlers/analytics-handler.js')

describe('guidance page handlers', () => {
  const cookiesPagePostHandler = miscRoutes.find(r => r.method === 'POST' && r.path === uri.COOKIES.uri).handler
  const cookiesPageGetHandler = miscRoutes.find(r => r.method === 'GET' && r.path === uri.COOKIES.uri).handler
  const accessibilityPageHandler = miscRoutes.find(r => r.path === uri.ACCESSIBILITY_STATEMENT.uri).handler
  const privacyPolicyPageHandler = miscRoutes.find(r => r.path === uri.PRIVACY_POLICY.uri).handler
  const refundPolicyPageHandler = miscRoutes.find(r => r.path === uri.REFUND_POLICY.uri).handler
  const osTermsPageHandler = miscRoutes.find(r => r.path === uri.OS_TERMS.uri).handler
  const newPricesPageHandler = miscRoutes.find(r => r.path === uri.NEW_PRICES.uri).handler
  const rpTermsConditionsHandler = miscRoutes.find(r => r.path === uri.RECURRING_TERMS_CONDITIONS.uri).handler

  describe('cookies page handler', () => {
    describe.each([
      ['get', cookiesPageGetHandler],
      ['post', cookiesPagePostHandler]
    ])('%s handler', (method, handler) => {
      const processEnv = process.env
      process.env.GTM_CONTAINER_ID = 'GTM-000000'

      beforeEach(jest.resetAllMocks)
      afterEach(() => {
        process.env = processEnv
        process.env.GTM_CONTAINER_ID = 'GTM-000000'
      })

      it.each([
        ['get', cookiesPageGetHandler],
        ['post', cookiesPagePostHandler]
      ])('only calls toolkit view function once for %s', async (method, handler) => {
        const toolkit = getMockToolkit()
        await handler(getMockRequest(), toolkit)
        expect(toolkit.view).toHaveBeenCalledTimes(1)
      })

      it.each([
        ['get', cookiesPageGetHandler, 'cookies.policy.page'],
        ['get', cookiesPageGetHandler, 'page.url'],
        ['get', cookiesPageGetHandler, 'policy-for-cookies'],
        ['post', cookiesPagePostHandler, 'cookies.policy.page'],
        ['post', cookiesPagePostHandler, 'page.url'],
        ['post', cookiesPagePostHandler, 'policy-for-cookies']
      ])('sets cookie page for %s', async (method, handler, cookiesPage) => {
        const toolkit = getMockToolkit()
        uri.COOKIES.page = cookiesPage
        await handler(getMockRequest(), toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(cookiesPage, expect.any(Object))
      })

      it.each([['csrf_token_cookie_name'], ['any_name'], ['token_cookie']])(
        'sets cookie.csrf to match process.env.CSRF_TOKEN_COOKIE_NAME',
        async csrf => {
          process.env.CSRF_TOKEN_COOKIE_NAME = csrf
          const toolkit = getMockToolkit()
          await handler(getMockRequest(), toolkit)
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
        async defaultName => {
          delete process.env.CSRF_TOKEN_COOKIE_NAME
          constants.CSRF_TOKEN_COOKIE_NAME_DEFAULT = defaultName
          const toolkit = getMockToolkit()
          await handler(getMockRequest(), toolkit)
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
        async sessionCookieName => {
          process.env.SESSION_COOKIE_NAME = sessionCookieName
          const toolkit = getMockToolkit()
          await handler(getMockRequest(), toolkit)
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
        async defaultName => {
          delete process.env.SESSION_COOKIE_NAME
          constants.SESSION_COOKIE_NAME_DEFAULT = defaultName
          const toolkit = getMockToolkit()
          await handler(getMockRequest(), toolkit)
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
        async defaultName => {
          constants.ALB_COOKIE_NAME = defaultName
          const toolkit = getMockToolkit()
          await handler(getMockRequest(), toolkit)
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
        async defaultName => {
          constants.ALBCORS_COOKIE_NAME = defaultName
          const toolkit = getMockToolkit()
          await handler(getMockRequest(), toolkit)
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
      ])('sets altLang to be other item in two-item language array', async (locales, locale, altLang) => {
        const request = getMockRequest({ locales, locale })
        const toolkit = getMockToolkit()
        await handler(request, toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            altLang: [altLang]
          })
        )
      })

      it.each([[{ msg_header: 'header1', msg_body: 'body1' }], [{ msg_header: 'header2', msg_body: 'body2' }]])(
        'returns messages from catalog',
        async catalog => {
          const request = getMockRequest({ catalog })
          const toolkit = getMockToolkit()
          await handler(request, toolkit)
          expect(toolkit.view).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              mssgs: catalog
            })
          )
        }
      )

      it.each([['123456'], ['XXXXXX'], ['124567']])('returns gtmContainerId', async gtm => {
        process.env.GTM_CONTAINER_ID = gtm
        const request = getMockRequest({})
        const toolkit = getMockToolkit()
        await handler(request, toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            gtmContainerId: gtm
          })
        )
      })

      it('returns pageLanguageSetToWelsh', async () => {
        const welshEnabled = Symbol('enabled')
        welshEnabledAndApplied.mockReturnValueOnce(welshEnabled)
        const request = getMockRequest({})
        const toolkit = getMockToolkit()
        await handler(request, toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            pageLanguageSetToWelsh: welshEnabled
          })
        )
      })

      it('returns uris with language code added', async () => {
        const mockUri = Symbol('terms')
        addLanguageCodeToUri.mockReturnValue(mockUri)
        const request = getMockRequest({})
        const toolkit = getMockToolkit()
        await handler(request, toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            uri: {
              back: mockUri,
              cookies: mockUri
            }
          })
        )
      })

      it.each([
        [true, 'accept'],
        [false, 'reject']
      ])('sets value of analyticsResponse when acceptTracking is %', async (acceptTracking, expected) => {
        const analytics = {
          [ANALYTICS.acceptTracking]: acceptTracking
        }
        const referrer = CONTROLLER.uri
        const request = getMockRequest(
          { locale: 'this-locale', locales: ['this-locale', 'that-locale'], catalog: 'catalog' },
          referrer,
          analytics
        )
        const toolkit = getMockToolkit()
        await handler(request, toolkit)
        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            analyticsResponse: expected
          })
        )
      })

      it.each([[Symbol('view-return')], [Symbol('view.return')]])('returns h.view return value', async viewReturn => {
        const toolkit = getMockToolkit()
        toolkit.view.mockReturnValue(viewReturn)
        const returned = await handler(getMockRequest(), toolkit)
        expect(returned).toEqual(viewReturn)
      })
    })

    describe('cookies page handler for post', () => {
      it('calls checkAnalyticsCookiesPage with the request', async () => {
        const request = getMockRequest()
        const toolkit = getMockToolkit()

        await cookiesPagePostHandler(request, toolkit)

        expect(checkAnalyticsCookiesPage).toHaveBeenCalledWith(request)
      })

      it.each([
        [{ analyticsResponse: 'accept' }, true],
        [{ analyticsResponse: 'reject' }, true],
        [{}, undefined]
      ])('sets showNotification based on analyticsResponse', async (payload, expected) => {
        const referrer = CONTROLLER.uri
        const request = getMockRequest(
          { locale: 'this-locale', locales: ['this-locale', 'that-locale'], catalog: 'catalog' },
          referrer,
          '',
          payload
        )
        const toolkit = getMockToolkit()

        await cookiesPagePostHandler(request, toolkit)

        expect(toolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            showNotification: expected
          })
        )
      })

      it.each([['csrf_token_cookie_name'], ['any_name'], ['token_cookie']])(
        'sets CSRF_TOKEN_NAME to match process.env.CSRF_TOKEN_COOKIE_NAME',
        async csrf => {
          process.env.CSRF_TOKEN_COOKIE_NAME = csrf
          const toolkit = getMockToolkit()
          await cookiesPagePostHandler(getMockRequest(), toolkit)
          expect(toolkit.view).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              CSRF_TOKEN_NAME: csrf
            })
          )
        }
      )

      it.each([['default cookie name'], ['csrf-token-cookie-name-default']])(
        "sets CSRF_TOKEN_NAME to default if process.env.CSRF_TOKEN_COOKIE_NAME isn't provided",
        async defaultName => {
          delete process.env.CSRF_TOKEN_COOKIE_NAME
          constants.CSRF_TOKEN_COOKIE_NAME_DEFAULT = defaultName
          const toolkit = getMockToolkit()
          await cookiesPagePostHandler(getMockRequest(), toolkit)
          expect(toolkit.view).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              CSRF_TOKEN_NAME: defaultName
            })
          )
        }
      )

      it.each([['csrf_token_cookie_value'], ['any_value'], ['token_value']])(
        'grabs CSRF_TOKEN_VALUE correctly based on generate from crumb',
        async csrf => {
          const request = getMockRequest(
            { locale: 'this-locale', locales: ['this-locale', 'that-locale'], catalog: 'catalog' },
            CONTROLLER.uri,
            '',
            {},
            csrf
          )
          const toolkit = getMockToolkit()

          await cookiesPagePostHandler(request, toolkit)

          expect(toolkit.view).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              CSRF_TOKEN_VALUE: csrf
            })
          )
        }
      )
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
    { pageHandler: cookiesPageGetHandler, handlerName: 'Cookies' }
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
    { pageHandler: cookiesPageGetHandler, handlerName: 'Cookies' },
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

  const getMockRequest = (i18nValues, referer, analytics, payload, csrfToken = 'token') => {
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
      payload,
      url: {
        search: ''
      },
      headers: {
        referer
      },
      cache: jest.fn(() => ({
        helpers: {
          analytics: {
            get: jest.fn().mockResolvedValue(analytics)
          }
        }
      })),
      server: {
        plugins: {
          crumb: {
            generate: jest.fn().mockResolvedValue(csrfToken)
          }
        }
      }
    }
  }

  const getMockToolkit = () => ({
    view: jest.fn()
  })
})
