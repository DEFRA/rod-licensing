/**
 * The hapi server
 */

import Hapi from '@hapi/hapi'
import CatboxRedis from '@hapi/catbox-redis'
import Vision from '@hapi/vision'
import Inert from '@hapi/inert'
import Nunjucks from 'nunjucks'
import find from 'find'
import path from 'path'
import Dirname from '../dirname.cjs'
import routes from './routes/routes.js'
import { ERROR, SESSION_TTL_MS_DEFAULT, REDIS_PORT_DEFAULT, SESSION_COOKIE_NAME_DEFAULT } from './constants.js'
import sessionManager from './lib/session-manager.js'
import { cacheDecorator } from './lib/cache-decorator.js'

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
  await server.register([Inert, Vision])
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
    ttl: process.env.SESSION_TTL_MS || SESSION_TTL_MS_DEFAULT, // Expire after 3 hours by default
    isSecure: process.env.NODE_ENV !== 'development',
    isHttpOnly: process.env.NODE_ENV !== 'development',
    encoding: 'base64json',
    clearInvalid: true,
    strictHeader: true
  }

  console.debug({ sessionCookieOptions })

  server.state(sessionCookieName, sessionCookieOptions)

  server.ext('onPreHandler', sessionManager(sessionCookieName))

  server.ext('onPreResponse', (request, h) => {
    if (!request.response.isBoom) {
      return h.continue
    }

    console.error(request.response)
    return h.view(ERROR.page).code(request.response.output.statusCode)
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
