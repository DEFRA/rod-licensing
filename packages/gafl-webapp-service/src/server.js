/**
 * The hapi server
 */

import Hapi from '@hapi/hapi'
import CatboxRedis from '@hapi/catbox-redis'
import Nunjucks from 'nunjucks'
import find from 'find'
import path from 'path'
import Dirname from '../dirname.cjs'
import routes from './routes/routes.js'
import {
  CHANNEL_DEFAULT,
  CSRF_TOKEN_COOKIE_NAME_DEFAULT,
  FEEDBACK_URI_DEFAULT,
  REDIS_PORT_DEFAULT,
  SESSION_COOKIE_NAME_DEFAULT,
  SESSION_TTL_MS_DEFAULT
} from './constants.js'
import { ACCESSIBILITY_STATEMENT, COOKIES, PRIVACY_POLICY, REFUND_POLICY, NEW_TRANSACTION } from './uri.js'

import sessionManager, { isStaticResource } from './session-cache/session-manager.js'
import { cacheDecorator } from './session-cache/cache-decorator.js'
import { errorHandler } from './handlers/error-handler.js'
import { initialise as initialiseOIDC } from './handlers/oidc-handler.js'
import { getPlugins } from './plugins.js'
import { airbrake } from '@defra-fish/connectors-lib'
airbrake.initialise()
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
                db: 0,
                ...(process.env.REDIS_PASSWORD && {
                  password: process.env.REDIS_PASSWORD,
                  tls: {}
                })
              }
            }
          }
        ]
      },
      options
    )
  )
  const keepAlive = Number.parseInt(process.env.HAPI_KEEP_ALIVE_TIMEOUT_MS || 60000)
  server.listener.keepAliveTimeout = keepAlive
  server.listener.headersTimeout = keepAlive + 5000
}

const getServer = () => server

/*
  * The hapi plugins and their options which will be registered on initialization
  */
const getSessionCookieName = () => process.env.SESSION_COOKIE_NAME || SESSION_COOKIE_NAME_DEFAULT
export const getCsrfTokenCookieName = () => process.env.CSRF_TOKEN_COOKIE_NAME || CSRF_TOKEN_COOKIE_NAME_DEFAULT

/**
  * Adds the uri's used by the layout page to each relevant response
  */
const layoutContextAmalgamation = (request, h) => {
  const response = request.response
  if (request.method === 'get' && response.variety === 'view') {
    Object.assign(response.source.context, {
      CSRF_TOKEN_NAME: getCsrfTokenCookieName(),
      CSRF_TOKEN_VALUE: response.source.context[getCsrfTokenCookieName()],
      TELESALES: process.env.CHANNEL && process.env.CHANNEL !== CHANNEL_DEFAULT,
      _uri: {
        cookies: COOKIES.uri,
        refunds: REFUND_POLICY.uri,
        accessibility: ACCESSIBILITY_STATEMENT.uri,
        privacy: PRIVACY_POLICY.uri,
        feedback: process.env.FEEDBACK_URI || FEEDBACK_URI_DEFAULT,
        clear: NEW_TRANSACTION.uri
      },
      credentials: request.auth.credentials
    })
  }
  return h.continue
}

// Add default headers
const addDefaultHeaders = (request, h) => {
  if (!isStaticResource(request)) {
    request.response.header('X-Frame-Options', 'DENY')
    request.response.header('Cache-Control', 'no-store')
    request.response.header('X-XSS-Protection', '1; mode=block')
  }
  request.response.header('X-Content-Type-Options', 'nosniff')
  request.response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  return h.continue
}

const init = async () => {
  await server.register(getPlugins())
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
    encoding: 'iron',
    password: process.env.SESSION_COOKIE_PASSWORD,
    clearInvalid: true,
    strictHeader: true,
    path: '/'
  }

  console.debug((({ password, ...o }) => o)(sessionCookieOptions))

  server.state(sessionCookieName, sessionCookieOptions)

  server.ext('onPreHandler', sessionManager(sessionCookieName))

  // Mop up 400 and 500 errors. Make sure the status code in the header is set accordingly and provide
  // the error object to the templates for specific messaging e.g. on payment failures
  server.ext('onPreResponse', errorHandler)

  // Add the uri's required by the template to every view response
  server.ext('onPreResponse', layoutContextAmalgamation)

  // Add default headers to the page responses
  server.ext('onPreResponse', addDefaultHeaders)

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

  if (process.env.CHANNEL === 'telesales') {
    await initialiseOIDC(server)
  }

  server.route(routes)
  await server.start()

  console.log('Server running on %s', server.info.uri)
}

const shutdownBehavior = () => {
  const shutdown = async code => {
    console.log(`Server is shutdown with ${code}`)
    await server.stop()
    await airbrake.flush()
    process.exit(code)
  }
  process.on('SIGINT', () => shutdown(130))
  process.on('SIGTERM', () => shutdown(137))
}

export { createServer, server, init, shutdownBehavior, getServer }
