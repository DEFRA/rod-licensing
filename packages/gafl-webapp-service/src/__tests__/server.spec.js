import { createServer, init, server } from '../server.js'
import CatboxMemory from '@hapi/catbox-memory'

describe('The server', () => {
  it('starts', async done => {
    createServer({
      port: 1234,
      cache: [
        {
          provider: {
            constructor: CatboxMemory
          }
        }
      ]
    })

    server.events.on('start', () => {
      expect(server.info.port).toBe(1234)
      server.stop()
      done()
    })

    await init()
  })
})
