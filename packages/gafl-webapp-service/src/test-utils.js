import { createServer, init, server } from './server.js'
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
      cookies[parts[1].trim()] = (parts[2] || '').trim()
    })
  return cookies
}

export { start, stop, server, getCookies }
