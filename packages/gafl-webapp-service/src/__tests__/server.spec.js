import { createServer, init, server } from '../server.js'
import CatboxMemory from '@hapi/catbox-memory'

describe('The server', () => {
  it('starts', async done => {
    createServer({
      cache: [
        {
          provider: {
            constructor: CatboxMemory
          }
        }
      ]
    })

    server.events.on('start', () => {
      expect(server.info).toBeTruthy()
      server.stop()
      done()
    })

    await init()
    expect(server.info).toBeTruthy()
  })
})
