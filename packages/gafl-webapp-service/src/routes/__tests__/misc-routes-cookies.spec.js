import uri from '../../uri.js'
import miscRoutes from '../misc-routes.js'
import constants from '../../constants.js'

jest.mock('../../uri.js', () => ({
  ...jest.requireActual('../../uri.js'),
  COOKIES: {
    uri: 'cookies.uri',
    page: 'biscuits'
  }
}))

jest.mock('../../constants.js', () => ({
  ...jest.requireActual('../../constants.js'),
  CSRF_TOKEN_COOKIE_NAME_DEFAULT: 'CSRF_TOKEN_COOKIE_NAME_DEFAULT'
}))

describe('cookies page handler', () => {
  const cookiesPageHandler = miscRoutes.find(r => r.path === uri.COOKIES.uri).handler
  const processEnv = process.env

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

  it.each(['controller-uri', 'controller.uri'])('sets uri.buy to be CONTROLLER.uri', controllerUri => {
    uri.CONTROLLER.uri = controllerUri
    const toolkit = getMockToolkit()
    cookiesPageHandler(getMockRequest(), toolkit)
    expect(toolkit.view).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        uri: {
          buy: controllerUri
        }
      })
    )
  })

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

  const getMockRequest = i18nValues => {
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
      }
    }
  }

  const getMockToolkit = () => ({
    view: jest.fn()
  })
})
