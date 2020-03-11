'use strict'

/**
 * Not a real mock hapi but hapi with no catbox-redis
 */

import { createServer, init, server } from '../src/server.js'
import CatboxMemory from '@hapi/catbox-memory'

createServer({
  cache: [
    {
      name: 'hapi-cache',
      provider: {
        constructor: CatboxMemory
      }
    }
  ]
})

beforeEach(async done => {
  server.events.on('start', () => {
    done()
  })
  await init()
})

afterEach(done => {
  server.events.on('stop', () => {
    done()
  })
  server.stop()
})

test('Server is alive', () => {
  expect(server.info.port).toBe(3000)
})
