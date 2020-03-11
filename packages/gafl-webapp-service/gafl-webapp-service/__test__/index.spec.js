'use strict'

/**
 * Not a real mock hapi but hapi with no catbox-redis
 */

import server from '../__mocks__/server'

beforeEach(async done => {
  server.events.on('start', () => {
    done()
  })
  await server.start()
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

