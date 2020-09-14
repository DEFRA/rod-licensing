import { createServer, init, server } from '../server.js'
import CatboxMemory from '@hapi/catbox-memory'

export const catboxOptions = {
  port: 1234,
  cache: [
    {
      provider: {
        constructor: CatboxMemory
      }
    }
  ]
}

describe('The server', () => {
  it('starts', async () => {
    createServer(catboxOptions)
    expect(server.info.port).toBe(1234)
    await server.stop()

    await init()
    expect(server.info.port).toBe(1234)
    await server.stop()
  })

  it('configures session handling in redis by default', async () => {
    process.env.REDIS_HOST = '0.0.0.0'
    process.env.REDIS_PORT = '12345'
    process.env.REDIS_PASSWORD = 'test123'
    createServer({ port: 1234 })
    expect(server.settings.cache).toEqual(
      expect.arrayContaining([
        {
          provider: {
            constructor: expect.any(Function),
            options: { db: 0, host: '0.0.0.0', partition: 'web-app', password: 'test123', port: '12345', tls: {} }
          }
        }
      ])
    )
  })

  describe('handles process interrupts', () => {
    it.each(['SIGINT', 'SIGTERM'])('implements a shutdown handler to respond to the %s signal', (signal, done) => {
      jest.isolateModules(async () => {
        const { shutdownBehavior, createServer, init } = require('../server.js')
        try {
          createServer((({ port, ...l }) => l)(catboxOptions))
          await init()
          shutdownBehavior()
          jest.spyOn(process, 'exit').mockImplementation(async () => {
            expect(true).toBeTruthy()
            // Allows time for the server to shut down
            await new Promise(resolve => setTimeout(resolve, 1000))
            done()
          })
          process.emit(signal)
        } catch (e) {
          console.log(e)
        }
      })
    })
  })
})
