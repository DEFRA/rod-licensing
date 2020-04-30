import { createServer, init, server } from '../server.js'
import { SESSION_COOKIE_NAME_DEFAULT, CONTROLLER, TEST_TRANSACTION, TEST_STATUS } from '../constants.js'

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

const injectWithCookie = async (method, url, payload) => {
  return server.inject({
    method,
    url,
    payload,
    headers: { cookie: `${SESSION_COOKIE_NAME_DEFAULT}=${global.cookies.sid}` }
  })
}

const injectWithoutCookie = async (method, url, payload) => {
  return server.inject({
    method,
    url,
    payload
  })
}

const postRedirectGet = async (uri, payload) => {
  await injectWithCookie('POST', uri, payload)
  return injectWithCookie('GET', CONTROLLER.uri)
}

export { start, stop, server, getCookies, initialize, injectWithCookie, injectWithoutCookie, postRedirectGet }
