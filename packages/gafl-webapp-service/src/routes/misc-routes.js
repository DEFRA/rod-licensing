import {
  CONTROLLER,
  NEW_TRANSACTION,
  ADD_PERMISSION,
  AGREED,
  COOKIES,
  ACCESSIBILITY_STATEMENT,
  PRIVACY_POLICY,
  REFUND_POLICY,
  AUTHENTICATE,
  RENEWAL_PUBLIC,
  IDENTIFY,
  OS_TERMS,
  PROCESS_ANALYTICS_PREFERENCES,
  NEW_PRICES,
  RECURRING_TERMS_CONDITIONS
} from '../uri.js'

import {
  SESSION_COOKIE_NAME_DEFAULT,
  CSRF_TOKEN_COOKIE_NAME_DEFAULT,
  ALB_COOKIE_NAME,
  ALBCORS_COOKIE_NAME,
  ANALYTICS
} from '../constants.js'

import addPermission from '../session-cache/add-permission.js'
import newSessionHandler from '../handlers/new-session-handler.js'
import agreedHandler from '../handlers/agreed-handler.js'
import controllerHandler from '../handlers/controller-handler.js'
import authenticationHandler from '../handlers/authentication-handler.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'
import analytics, { checkAnalyticsResponse } from '../handlers/analytics-handler.js'
import { welshEnabledAndApplied } from '../processors/page-language-helper.js'

const gtmContainerIdOrNull = () => process.env.GTM_CONTAINER_ID || false

const simpleView = view => ({
  method: 'GET',
  path: view.uri,
  handler: async (request, h) => {
    const mssgs = request.i18n.getCatalog()
    const altLang = request.i18n.getLocales().filter(locale => locale !== request.i18n.getLocale())
    const gtmContainerId = gtmContainerIdOrNull()
    const pageLanguageSetToWelsh = welshEnabledAndApplied(request)
    const recurringUri = addLanguageCodeToUri(request, RECURRING_TERMS_CONDITIONS.uri)
    const backUri = request?.headers?.referer?.endsWith(recurringUri) ? recurringUri : addLanguageCodeToUri(request, CONTROLLER.uri)

    return h.view(view.page, {
      mssgs,
      altLang,
      gtmContainerId,
      pageLanguageSetToWelsh,
      uri: {
        back: backUri
      }
    })
  }
})

const cookiesView = (request, analyticsCache) => {
  const altLang = request.i18n.getLocales().filter(locale => locale !== request.i18n.getLocale())
  const gtmContainerId = gtmContainerIdOrNull()
  const pageLanguageSetToWelsh = welshEnabledAndApplied(request)
  const recurringUri = addLanguageCodeToUri(request, RECURRING_TERMS_CONDITIONS.uri)
  const backUri = request?.headers?.referer?.endsWith(recurringUri) ? recurringUri : addLanguageCodeToUri(request, CONTROLLER.uri)
  const analyticsResponse = analyticsCache?.[ANALYTICS.acceptTracking] === true ? 'accept' : 'reject'

  return {
    altLang,
    gtmContainerId,
    pageLanguageSetToWelsh,
    mssgs: request.i18n.getCatalog(),
    cookie: {
      csrf: process.env.CSRF_TOKEN_COOKIE_NAME || CSRF_TOKEN_COOKIE_NAME_DEFAULT,
      sess: process.env.SESSION_COOKIE_NAME || SESSION_COOKIE_NAME_DEFAULT,
      alb: ALB_COOKIE_NAME,
      albcors: ALBCORS_COOKIE_NAME
    },
    uri: {
      back: backUri,
      cookies: addLanguageCodeToUri(request, COOKIES.uri)
    },
    analyticsResponse
  }
}

export default [
  {
    method: 'GET',
    path: '/',
    handler: async (_request, h) => h.redirectWithLanguageCode(CONTROLLER.uri)
  },
  {
    method: 'GET',
    path: CONTROLLER.uri,
    handler: controllerHandler
  },
  {
    method: 'GET',
    path: AUTHENTICATE.uri,
    handler: authenticationHandler
  },
  {
    method: 'GET',
    path: RENEWAL_PUBLIC.uri,
    handler: async (request, h) => {
      await request.cache().initialize()
      await addPermission(request)
      if (request.params.referenceNumber) {
        await request.cache().helpers.status.setCurrentPermission({ referenceNumber: request.params.referenceNumber })
      }
      return h.redirectWithLanguageCode(IDENTIFY.uri)
    }
  },
  {
    method: 'GET',
    path: AGREED.uri,
    handler: agreedHandler
  },
  {
    method: 'GET',
    path: NEW_TRANSACTION.uri,
    handler: newSessionHandler
  },
  {
    method: 'GET',
    path: ADD_PERMISSION.uri,
    handler: async (request, h) => {
      await addPermission(request)
      return h.redirectWithLanguageCode(CONTROLLER.uri)
    }
  },
  {
    method: 'GET',
    path: COOKIES.uri,
    handler: async (request, h) => {
      const analyticsCache = await request.cache().helpers.analytics.get()
      return h.view(COOKIES.page, cookiesView(request, analyticsCache))
    }
  },
  {
    method: 'POST',
    path: COOKIES.uri,
    handler: async (request, h) => {
      await checkAnalyticsResponse(request)
      const analyticsCache = await request.cache().helpers.analytics.get()

      const showNotification = request.payload?.analyticsResponse !== undefined ? true : undefined

      return h.view(COOKIES.page, {
        ...cookiesView(request, analyticsCache),
        showNotification,
        SHOW_WELSH_CONTENT: process.env.SHOW_WELSH_CONTENT?.toLowerCase() === 'true'
      })
    }
  },
  {
    method: 'GET',
    path: NEW_PRICES.uri,
    handler: async (request, h) => {
      const altLang = request.i18n.getLocales().filter(locale => locale !== request.i18n.getLocale())
      const gtmContainerId = gtmContainerIdOrNull()
      const pageLanguageSetToWelsh = welshEnabledAndApplied(request)

      return h.view(NEW_PRICES.page, {
        altLang,
        gtmContainerId,
        pageLanguageSetToWelsh,
        mssgs: request.i18n.getCatalog(),
        uri: {
          back: addLanguageCodeToUri(request, CONTROLLER.uri)
        }
      })
    }
  },
  {
    method: 'GET',
    path: RECURRING_TERMS_CONDITIONS.uri,
    handler: async (request, h) => {
      const altLang = request.i18n.getLocales().filter(locale => locale !== request.i18n.getLocale())
      const gtmContainerId = gtmContainerIdOrNull()
      const pageLanguageSetToWelsh = welshEnabledAndApplied(request)

      return h.view(RECURRING_TERMS_CONDITIONS.page, {
        altLang,
        gtmContainerId,
        pageLanguageSetToWelsh,
        mssgs: request.i18n.getCatalog(),
        uri: {
          privacy: addLanguageCodeToUri(request, PRIVACY_POLICY.uri),
          refund: addLanguageCodeToUri(request, REFUND_POLICY.uri)
        }
      })
    }
  },
  {
    method: 'POST',
    path: PROCESS_ANALYTICS_PREFERENCES.uri,
    handler: analytics
  },
  {
    method: 'GET',
    path: PRIVACY_POLICY.uri,
    handler: async (request, h) => {
      const altLang = request.i18n.getLocales().filter(locale => locale !== request.i18n.getLocale())
      const gtmContainerId = gtmContainerIdOrNull()
      const pageLanguageSetToWelsh = welshEnabledAndApplied(request)

      return h.view(PRIVACY_POLICY.page, {
        altLang,
        gtmContainerId,
        pageLanguageSetToWelsh,
        mssgs: request.i18n.getCatalog(),
        uri: {
          back: addLanguageCodeToUri(request, CONTROLLER.uri),
          cookies: addLanguageCodeToUri(request, COOKIES.uri)
        }
      })
    }
  },
  simpleView(ACCESSIBILITY_STATEMENT),
  simpleView(REFUND_POLICY),
  simpleView(OS_TERMS)
]
