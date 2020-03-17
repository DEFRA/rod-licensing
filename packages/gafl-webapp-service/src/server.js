'use strict'

/**
 * The hapi
 */

import Hapi from '@hapi/hapi'
import CatboxRedis from '@hapi/catbox-redis'
import Vision from '@hapi/vision'
import Inert from '@hapi/inert'
import Nunjucks from 'nunjucks'
import find from 'find'
import path from 'path'
import Dirname from '../dirname.cjs'
import routes from './routes.js'

import sessionManager from './lib/session-manager.js'
import cacheDecorator from './lib/cache-decorator.js'

let server

const createServer = options => {
  server = Hapi.server(
    Object.assign(
      {
        host: 'localhost',
        cache: [
          {
            provider: {
              constructor: CatboxRedis
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
      path.join(Dirname, 'node_modules/govuk-frontend/govuk'),
      path.join(Dirname, 'node_modules/govuk-frontend/govuk/components'),
      path.join(Dirname, 'src/layout'),
      ...viewPaths
    ]
  })

  const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'sid'

  const sessionCookieOptions = {
    ttl: process.env.SESSION_TTL_MS || 3 * 60 * 60 * 1000, // Expire after 3 hours by default
    isSecure: process.env.NODE_ENV !== 'development',
    isHttpOnly: process.env.NODE_ENV !== 'development',
    encoding: 'base64json',
    clearInvalid: true,
    strictHeader: true
  }

  console.debug({ sessionCookieOptions })

  server.state(sessionCookieName, sessionCookieOptions)

  server.ext('onPreHandler', sessionManager(sessionCookieName))

  // Point the server plugin cache to an application cache to hold authenticated session data
  server.app.cache = server.cache({
    segment: 'sessions',
    expiresIn: process.env.SESSION_TTL_MS || 3 * 60 * 60 * 1000
  })

  /*
   * Decorator to make access to the session cache available as
   * simple setters and getters hiding the session key.
   */
  server.decorate('request', 'cache', cacheDecorator(sessionCookieName))

  process.on('unhandledRejection', err => {
    console.error(err)
  })

  await server.start()
  console.log('Server running on %s', server.info.uri)

  server.route(routes)
}

export { createServer, server, init }
