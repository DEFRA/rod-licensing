import { createServer, init, server } from '../server.js'
import { SESSION_COOKIE_NAME_DEFAULT, CSRF_TOKEN_COOKIE_NAME_DEFAULT } from '../constants.js'
import { TEST_TRANSACTION, TEST_STATUS, CONTROLLER } from '../uri.js'

import CatboxMemory from '@hapi/catbox-memory'

createServer({
  cache: [
    {
      provider: {
        constructor: CatboxMemory
      }
    }
  ]
})

const start = async done => {
  server.events.on('start', () => {
    done()
  })

  // Add a helper route to expose the transaction cache
  server.route({
    method: 'GET',
    path: TEST_TRANSACTION.uri,
    handler: async request => request.cache().helpers.transaction.get()
  })

  server.route({
    method: 'GET',
    path: TEST_STATUS.uri,
    handler: async request => request.cache().helpers.status.get()
  })

  // clear cache
  server.route({
    method: 'GET',
    path: '/buy/clear-cache',
    handler: async request => {
      await request.cache().clear()
      return 'ok'
    }
  })

  await init()
}

const stop = async done => {
  server.events.on('stop', () => {
    done()
  })
  server.stop()
}

const getCookies = response => {
  const cookies = {}
  response.headers['set-cookie'] &&
    response.headers['set-cookie'].forEach(cookie => {
      const parts = cookie.split(';')[0].match(/(.*?)=(.*)$/)
      cookies[parts[1].trim()] = parts[2].trim()
    })
  return cookies
}

const initialize = async done => {
  const data = await server.inject({
    method: 'GET',
    url: '/buy'
  })

  global.cookies = getCookies(data)

  done()
}

const injectWithCookies = async (method, url, payload = {}) => {
  if (method === 'POST') {
    Object.assign(payload, { [CSRF_TOKEN_COOKIE_NAME_DEFAULT]: global.cookies[CSRF_TOKEN_COOKIE_NAME_DEFAULT] })
  }
  return server.inject({
    method,
    url,
    payload,
    headers: {
      cookie: `${SESSION_COOKIE_NAME_DEFAULT}=${global.cookies.sid}; ${CSRF_TOKEN_COOKIE_NAME_DEFAULT}=${global.cookies[CSRF_TOKEN_COOKIE_NAME_DEFAULT]}`
    }
  })
}

const injectWithoutSessionCookie = async (method, url, payload = {}) => {
  Object.assign(payload, { [CSRF_TOKEN_COOKIE_NAME_DEFAULT]: global.cookies[CSRF_TOKEN_COOKIE_NAME_DEFAULT] })
  return server.inject({
    method,
    url,
    payload,
    headers: { cookie: `${CSRF_TOKEN_COOKIE_NAME_DEFAULT}=${global.cookies[CSRF_TOKEN_COOKIE_NAME_DEFAULT]}` }
  })
}

const postRedirectGet = async (uri, payload) => {
  await injectWithCookies('POST', uri, payload)
  return injectWithCookies('GET', CONTROLLER.uri)
}

const backLinkRegEx = uri => new RegExp(`<a href=\\"${uri}\\" .*>Back</a>`)

export { start, stop, server, getCookies, initialize, injectWithCookies, injectWithoutSessionCookie, postRedirectGet, backLinkRegEx }
