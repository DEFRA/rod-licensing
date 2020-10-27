import { createServer, init, server } from '../server.js'
import CatboxMemory from '@hapi/catbox-memory'

jest.mock('@defra-fish/connectors-lib')

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

  describe.each([
    ['SIGINT', 130],
    ['SIGTERM', 137]
  ])('implements a shutdown handler to respond to the %s signal', (signal, code) => {
    it('calls the hapi shutdown hook', done => {
      jest.isolateModules(async () => {
        const { shutdownBehavior, createServer, init } = require('../server.js')
        try {
          createServer((({ port, ...l }) => l)(catboxOptions))
          await init()
          shutdownBehavior()
          const serverStopSpy = jest.spyOn(server, 'stop').mockImplementation(jest.fn())
          const processStopSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
          process.emit(signal)
          setImmediate(async () => {
            expect(serverStopSpy).toHaveBeenCalled()
            expect(processStopSpy).toHaveBeenCalledWith(code)
            jest.restoreAllMocks()
            await server.stop()
            done()
          })
        } catch (e) {
          done(e)
        }
      })
    })
  })
})
