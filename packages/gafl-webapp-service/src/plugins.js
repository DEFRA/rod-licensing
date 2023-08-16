import db from 'debug'
import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import Disinfect from 'disinfect'
import Scooter from '@hapi/scooter'
import Blankie from 'blankie'
import Crumb from '@hapi/crumb'
import HapiGapi from '@defra/hapi-gapi'
import Cookie from '@hapi/cookie'
import HapiI18n from 'hapi-i18n'
import { useSessionCookie } from './session-cache/session-manager.js'
import { getCsrfTokenCookieName } from './server.js'
import { trackAnalyticsAccepted, getAnalyticsSessionId, pageOmitted } from '../src/handlers/analytics-handler.js'
import Dirname from '../dirname.cjs'
import path from 'path'

const debug = db('webapp:plugin')

// This is a hash of the inline script at line 31 of the GDS template. It is added to the CSP to except the in-line
// script. It needs the quotes.
const scriptHash = "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='"

const trackAnalytics = async request => {
  const pageOmit = await pageOmitted(request)
  const canTrack = await trackAnalyticsAccepted(request, pageOmit)
  const optDebug = process.env.ENABLE_ANALYTICS_OPT_IN_DEBUGGING?.toLowerCase() === 'true'
  if (optDebug) {
    const sessionId = await getAnalyticsSessionId(request)
    if (canTrack === true) {
      debug(`Session is being tracked for: ${sessionId}`)
    } else {
      if (pageOmit === true) {
        debug(`Session is not tracking current page for: ${sessionId}`)
      } else {
        debug(`Session is not being tracked for: ${sessionId}`)
      }
    }
  }
  return canTrack
}

const initialiseDisinfectPlugin = () => ({
  plugin: Disinfect,
  options: {
    disinfectQuery: true,
    disinfectParams: true,
    disinfectPayload: true
  }
})

const initialiseBlankiePlugin = () => ({
  plugin: Blankie,
  options: {
    /*
     * This defines the content security policy - which is as restrictive as possible
     * It must allow web-fonts from 'fonts.gstatic.com'
     */
    fontSrc: ['self', 'fonts.gstatic.com', 'data:'],
    scriptSrc: ['self', 'unsafe-inline', scriptHash],
    generateNonces: true,
    frameAncestors: 'none'
  }
})

const initialiseCrumbPlugin = () => ({
  plugin: Crumb,
  options: {
    key: getCsrfTokenCookieName(),
    cookieOptions: {
      isSecure: process.env.NODE_ENV !== 'development',
      isHttpOnly: process.env.NODE_ENV !== 'development'
    },
    logUnauthorized: true
  }
})

const initialiseHapiGapiPlugin = () => {
  const hapiGapiPropertySettings = []
  if (process.env.ANALYTICS_PRIMARY_PROPERTY) {
    console.log('hit')
    hapiGapiPropertySettings.push({
      id: process.env.ANALYTICS_PRIMARY_PROPERTY,
      key: process.env.ANALYTICS_PROPERTY_API,
      hitTypes: ['page_view']
    })
  } else {
    console.warn("ANALYTICS_PRIMARY_PROPERTY not set, so Google Analytics won't track this")
  }

  return {
    plugin: HapiGapi,
    options: {
      propertySettings: hapiGapiPropertySettings,
      trackAnalytics: trackAnalytics,
      sessionIdProducer: async request => {
        let sessionId = null
        if (useSessionCookie(request)) {
          const { gaClientId } = await request.cache().helpers.status.get()
          sessionId = gaClientId ?? (await request.cache().getId())
        }
        return sessionId
      }
    }
  }
}

const initialiseHapiI18nPlugin = () => {
  const showWelshContent = process.env.SHOW_WELSH_CONTENT?.toLowerCase() === 'true'
  return {
    plugin: HapiI18n,
    options: {
      locales: ['en', ...(showWelshContent ? ['cy'] : [])],
      directory: path.join(Dirname, 'src/locales'),
      ...(showWelshContent && { queryParameter: 'lang' })
    }
  }
}

export const getPlugins = () => {
  return [
    Inert,
    Vision,
    Scooter,
    Cookie,
    initialiseDisinfectPlugin(),
    initialiseBlankiePlugin(),
    initialiseCrumbPlugin(),
    initialiseHapiGapiPlugin(),
    initialiseHapiI18nPlugin()
  ]
}
