'use strict'

/**
 * The hapi
 */

import Hapi from '@hapi/hapi'
import CatboxRedis from '@hapi/catbox-redis'
import Vision from '@hapi/vision'
import Nunjucks from 'nunjucks'
import glob from 'glob'
import db from 'debug'

import routes from './routes.js'
import sessionManager from './lib/session-manager.js'
import cacheDecorator from './lib/cache-decorator.js'

const debug = db('server')

// Get a list of the available views
const views = glob.sync('./src/pages/*/')

let server

const createServer = options => {
  server = Hapi.server(Object.assign({
    port: 3000,
    host: 'localhost',
    cache: [
      {
        provider: {
          constructor: CatboxRedis
        }
      }
    ]
  }, options))
}

const init = async () => {
  if (!server) {
    throw new Error('No server created')
  }

  await server.register(Vision)

  server.views({
    engines: {
      njk: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment)
          return (context) => {
            return template.render(context)
          }
        }
      }
    },
    path: views
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

  process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
  })

  await server.start()
  console.log('Server running on %s', server.info.uri)

  server.route(routes)
}

export { createServer, server, init }
