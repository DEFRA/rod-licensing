import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import Disinfect from 'disinfect'
import Scooter from '@hapi/scooter'
import Blankie from 'blankie'
import Crumb from '@hapi/crumb'
import Cookie from '@hapi/cookie'
import HapiI18n from 'hapi-i18n'
import { getCsrfTokenCookieName } from './server.js'
import Dirname from '../dirname.cjs'
import path from 'path'

// This is a hash provided by the GOV.UK Frontend:
// https://frontend.design-system.service.gov.uk/importing-css-assets-and-javascript/#use-a-hash-to-unblock-inline-javascript
// It is added to the CSP to except the in-line script. It needs the quotes.
const scriptHash = "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"

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
    fontSrc: ['self', 'fonts.gstatic.com'],
    scriptSrc: [
      'self',
      'unsafe-inline',
      scriptHash,
      '*.googletagmanager.com',
      '*.tagassistant.google.com',
      'unsafe-eval',
      'https://tagmanager.google.com/'
    ],
    connectSrc: ['self', '*.google-analytics.com', '*.googletagmanager.com', '*.analytics.google.com'],
    generateNonces: true,
    frameAncestors: 'none',
    imgSrc: ['self', 'unsafe-inline', 'www.googletagmanager.com', 'fonts.gstatic.com', 'data:', 'https://ssl.gstatic.com/'],
    manifestSrc: ['self'],
    styleSrc: ['unsafe-inline', 'self', 'fonts.googleapis.com', '*.googletagmanager.com', 'https://tagmanager.google.com/']
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
    initialiseHapiI18nPlugin()
  ]
}
