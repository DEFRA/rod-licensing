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

  describe('handles process interrupts', () => {
    it.each(['SIGINT', 'SIGTERM'])('implements a shutdown handler to respond to the %s signal', async signal => {
      const serverStopSpy = jest.spyOn(server, 'stop').mockImplementation(async () => {})
      const processStopSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})
      await process.emit(signal)
      expect(serverStopSpy).toHaveBeenCalled()
      expect(processStopSpy).toHaveBeenCalledWith(0)
      jest.restoreAllMocks()
    })
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
})
