'use strict'

import { createServer, init, server } from '../../../../src/server.js'
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

// Start application before running the test case
beforeAll(async done => {
  server.events.on('start', () => {
    done()
  })
  await init()
})

// Stop application after running the test case
afterAll(done => {
  server.events.on('stop', () => {
    done()
  })
  server.stop()
})

test('Should return success requesting the name page', async () => {
  const options = {
    method: 'GET',
    url: '/name',
    headers: {
      Cookie: 'sid=eyJpZCI6IjRiY2NhMmE2LTMyYmItNGM4Zi1hNjQxLThhNWRkNTk5ZTdiNiJ9'
    }
  }
  const data = await server.inject(options)
  expect(data.statusCode).toBe(200)
})
