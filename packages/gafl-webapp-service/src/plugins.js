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
import { UTM } from './constants.js'
import { getCsrfTokenCookieName } from './server.js'
import Dirname from '../dirname.cjs'
import path from 'path'

// This is a hash of the inline script at line 31 of the GDS template. It is added to the CSP to except the in-line
// script. It needs the quotes.
const scriptHash = "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='"

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
    hapiGapiPropertySettings.push({ id: process.env.ANALYTICS_PRIMARY_PROPERTY, hitTypes: ['pageview', 'event', 'ecommerce'] })
  } else {
    console.warn("ANALYTICS_PRIMARY_PROPERTY not set, so Google Analytics won't track this")
  }
  if (process.env.ANALYTICS_XGOV_PROPERTY) {
    hapiGapiPropertySettings.push({ id: process.env.ANALYTICS_XGOV_PROPERTY, hitTypes: ['pageview'] })
  } else {
    console.warn("ANALYTICS_XGOV_PROPERTY not set, so Google Analytics won't track this")
  }

  return {
    plugin: HapiGapi,
    options: {
      propertySettings: hapiGapiPropertySettings,
      sessionIdProducer: async request => {
        let sessionId = null
        if (useSessionCookie(request)) {
          const { gaClientId } = await request.cache().helpers.status.get()
          sessionId = gaClientId ?? (await request.cache().getId())
        }
        return sessionId
      },
      attributionProducer: async request => {
        if (useSessionCookie(request)) {
          const { attribution } = await request.cache().helpers.status.get()

          if (attribution) {
            return {
              campaign: attribution[UTM.CAMPAIGN],
              content: attribution[UTM.CONTENT],
              medium: attribution[UTM.MEDIUM],
              source: attribution[UTM.SOURCE],
              term: attribution[UTM.TERM]
            }
          }
        }
        return {}
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
