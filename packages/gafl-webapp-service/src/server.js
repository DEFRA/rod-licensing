/**
 * The hapi server
 */

import Hapi from '@hapi/hapi'
import CatboxRedis from '@hapi/catbox-redis'
import Vision from '@hapi/vision'
import Inert from '@hapi/inert'
import Scooter from '@hapi/scooter'
import HapiGapi from 'hapi-gapi'
import Crumb from '@hapi/crumb'
import Blankie from 'blankie'
import Nunjucks from 'nunjucks'
import find from 'find'
import path from 'path'
import Dirname from '../dirname.cjs'
import routes from './routes/routes.js'
import {
  CSRF_TOKEN_COOKIE_NAME_DEFAULT,
  REDIS_PORT_DEFAULT,
  SESSION_COOKIE_NAME_DEFAULT,
  SESSION_TTL_MS_DEFAULT,
  FEEDBACK_URI_DEFAULT,
  UTM
} from './constants.js'
import { COOKIES, REFUND_POLICY, ACCESSIBILITY_STATEMENT, PRIVACY_POLICY } from './uri.js'

import sessionManager, { useSessionCookie } from './session-cache/session-manager.js'
import { cacheDecorator } from './session-cache/cache-decorator.js'
import { errorHandler } from './handlers/error-handler.js'

let server

const createServer = options => {
  server = Hapi.server(
    Object.assign(
      {
        host: '0.0.0.0',
        cache: [
          {
            provider: {
              constructor: CatboxRedis,
              options: {
                partition: 'web-app',
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT || REDIS_PORT_DEFAULT,
                db: 0
              }
            }
          }
        ]
      },
      options
    )
  )
}

/*
 * The hapi plugins and their options which will be registered on initialization
 */

// This is a hash of the inline script at line 31 of the GDS template. It is added to the CSP to except the in-line
// script. It needs the quotes.
const scriptHash = "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='"
const getSessionCookieName = () => process.env.SESSION_COOKIE_NAME || SESSION_COOKIE_NAME_DEFAULT
const getPlugIns = () => {
  const plugins = [
    Inert,
    Vision,
    Scooter,
    {
      plugin: Blankie,
      options: {
        /*
        * This defines the content security policy - which is as restrictive as possible
        * It must allow web-fonts from 'fonts.gstatic.com'
        */
        fontSrc: ['self', 'fonts.gstatic.com', 'data:'],
        scriptSrc: [scriptHash],
        generateNonces: true
      }
    },
    {
      plugin: Crumb,
      options: {
        key: process.env.CSRF_TOKEN_COOKIE_NAME || CSRF_TOKEN_COOKIE_NAME_DEFAULT,
        cookieOptions: {
          isSecure: process.env.NODE_ENV !== 'development',
          isHttpOnly: process.env.NODE_ENV !== 'development'
        },
        logUnauthorized: true
      }
    }
  ]
  // TODO: when generating the plugins array, we should probably omit HapiGapi if we're on
  // a 'non-session-cookie' page
  if (process.env.ANALYTICS_PRIMARY_PROPERTY && process.env.ANALYTICS_EXGOV_PROPERTY) {
    plugins.push({
      plugin: HapiGapi,
      options: {
        propertySettings: [
          {
            id: process.env.ANALYTICS_PRIMARY_PROPERTY,
            hitTypes: ['pageview', 'event', 'ecommerce']
          },
          {
            id: process.env.ANALYTICS_EXGOV_PROPERTY,
            hitTypes: ['pageview']
          }
        ],
        sessionIdProducer: request => useSessionCookie(request) ? request.state[getSessionCookieName()].id : null,
        attributionProducer: async request => {
          if (useSessionCookie(request)) {
            const { attribution } = await request.cache().helpers.status.get()

            if (attribution) {
              return ({
                campaign: attribution[UTM.CAMPAIGN],
                content: attribution[UTM.CONTENT],
                medium: attribution[UTM.MEDIUM],
                source: attribution[UTM.SOURCE],
                term: attribution[UTM.TERM]
              })
            }
          }
          return {}
        },
        batchSize: 20,
        batchInterval: 15000
      }
    })
  }
  return plugins
}

/**
 * Adds the uri's used by the layout page to each relevant response
 */
const layoutContextAmalgamation = (request, h) => {
  const response = request.response
  if (request.method === 'get' && response.variety === 'view') {
    Object.assign(response.source.context, {
      _uri: {
        cookies: COOKIES.uri,
        refunds: REFUND_POLICY.uri,
        accessibility: ACCESSIBILITY_STATEMENT.uri,
        privacy: PRIVACY_POLICY.uri,
        feedback: process.env.FEEDBACK_URI || FEEDBACK_URI_DEFAULT
      }
    })
  }
  return h.continue
}

const init = async () => {
  await server.register(getPlugIns())
  const viewPaths = [...new Set(find.fileSync(/\.njk$/, path.join(Dirname, './src/pages')).map(f => path.dirname(f)))]

  server.views({
    engines: {
      njk: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment)
          return context => template.render(context)
        },
        prepare: (options, next) => {
          options.compileOptions.environment = Nunjucks.configure(options.path, { watch: false })
          return next()
        }
      }
    },

    relativeTo: Dirname,
    isCached: process.env.NODE_ENV !== 'development',

    // This needs all absolute paths to work with jest and in normal operation
    path: [
      path.join(Dirname, 'node_modules', 'govuk-frontend', 'govuk'),
      path.join(Dirname, 'node_modules', 'govuk-frontend', 'govuk', 'components'),
      path.join(Dirname, 'src/pages/layout'),
      path.join(Dirname, 'src/pages/macros'),
      ...viewPaths
    ]
  })

  const sessionCookieName = getSessionCookieName()

  const sessionCookieOptions = {
    ttl: process.env.SESSION_TTL_MS || SESSION_TTL_MS_DEFAULT, // Will be kept alive on each request
    isSecure: process.env.NODE_ENV !== 'development',
    isHttpOnly: process.env.NODE_ENV !== 'development',
    isSameSite: 'Lax', // Needed for the GOV pay redirect back into the service
    encoding: 'base64json',
    clearInvalid: true,
    strictHeader: true,
    path: '/buy'
  }

  console.debug({ sessionCookieOptions })

  server.state(sessionCookieName, sessionCookieOptions)

  server.ext('onPreHandler', sessionManager(sessionCookieName))

  // Mop up 400 and 500 errors. Make sure the status code in the header is set accordingly and provide
  // the error object to the templates for specific messaging e.g. on payment failures
  server.ext('onPreResponse', errorHandler)

  // Add the uri's required by the template to every view response
  server.ext('onPreResponse', layoutContextAmalgamation)

  // Point the server plugin cache to an application cache to hold authenticated session data
  server.app.cache = server.cache({
    segment: 'sessions',
    expiresIn: process.env.SESSION_TTL_MS || SESSION_TTL_MS_DEFAULT
  })

  /*
   * Decorator to make access to the session cache functions available as
   * simple setters and getters hiding the session key.
   */
  server.decorate('request', 'cache', cacheDecorator(sessionCookieName))

  process.on('unhandledRejection', console.error)
  server.route(routes)
  await server.start()

  console.log('Server running on %s', server.info.uri)
}

export { createServer, server, init }
