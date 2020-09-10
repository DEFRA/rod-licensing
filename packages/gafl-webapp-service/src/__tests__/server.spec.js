import { createServer, init, server } from '../server.js'
import CatboxMemory from '@hapi/catbox-memory'

describe('The server', () => {
  it('starts', async () => {
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
})
