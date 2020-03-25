import { createServer, init, server } from '../server.js'
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

  // Add a help route to expose the transaction cache
  server.route({
    method: 'GET',
    path: '/buy/transaction',
    handler: async request => {
      try {
        return request.cache().get('transaction')
      } catch (err) {
        return err
      }
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
    url: '/buy/add'
  })

  global.cookies = getCookies(data)

  await server.inject({
    method: 'GET',
    url: '/buy',
    headers: { cookie: 'sid=' + global.cookies.sid }
  })

  done()
}

const injectWithCookie = async (method, url, payload) => {
  return server.inject({
    method,
    url,
    payload,
    headers: { cookie: 'sid=' + global.cookies.sid }
  })
}

export { start, stop, server, getCookies, initialize, injectWithCookie }
