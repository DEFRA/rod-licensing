/**
 * The hapi server
 */

import Hapi from '@hapi/hapi'
import CatboxRedis from '@hapi/catbox-redis'
import Vision from '@hapi/vision'
import Inert from '@hapi/inert'
import Scooter from '@hapi/scooter'
import Blankie from 'blankie'
import Nunjucks from 'nunjucks'
import find from 'find'
import path from 'path'
import Dirname from '../dirname.cjs'
import routes from './routes/routes.js'
import { SESSION_TTL_MS_DEFAULT, REDIS_PORT_DEFAULT, SESSION_COOKIE_NAME_DEFAULT } from './constants.js'
import { CLIENT_ERROR, SERVER_ERROR, NEW_TRANSACTION, AGREED, CONTROLLER } from './uri.js'

import sessionManager from './session-cache/session-manager.js'
import { cacheDecorator } from './session-cache/cache-decorator.js'
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

const init = async () => {
  await server.register([
    Inert,
    Vision,
    Scooter,
    {
      plugin: Blankie,
      options: {
        /*
         * This defines the content security policy - which is as restrictive as possible
         * It must allow webfonts from 'fonts.gstatic.com'
         * Unfortunately unsafe-inline rather than script nonces must be used to prevent a console error from line
         * 31 of the GDS template. This will probably come up as an advisory in the PEN test
         */
        fontSrc: ['self', 'fonts.gstatic.com', 'data:'],
        scriptSrc: ['self', 'unsafe-inline'],
        generateNonces: false
      }
    }
  ])
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

  const sessionCookieName = process.env.SESSION_COOKIE_NAME || SESSION_COOKIE_NAME_DEFAULT

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
  server.ext('onPreResponse', async (request, h) => {
    if (!request.response.isBoom) {
      return h.continue
    }

    if (Math.floor(request.response.output.statusCode / 100) === 4) {
      return h
        .view(CLIENT_ERROR.page, {
          clientError: request.response.output.payload,
          uri: { new: NEW_TRANSACTION.uri, controller: CONTROLLER.uri }
        })
        .code(request.response.output.statusCode)
    } else {
      console.error(JSON.stringify(request.response, null, 4))
      return h
        .view(SERVER_ERROR.page, {
          serverError: request.response.output.payload,
          uri: { new: NEW_TRANSACTION.uri, agreed: AGREED.uri }
        })
        .code(request.response.output.statusCode)
    }
  })

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
