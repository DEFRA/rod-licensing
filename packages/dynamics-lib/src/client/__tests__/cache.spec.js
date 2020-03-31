describe('cache', () => {
  it('uses redis on the configured host and port', async () => {
    process.env.REDIS_HOST = 'localhost'
    process.env.REDIS_PORT = 123
    const options = require('../cache.js').config()
    expect(options).toMatchObject({
      store: expect.objectContaining({}),
      host: 'localhost',
      port: '123',
      ttl: 60 * 60 * 12
    })
  })

  it('uses the default redis port if one is not specified', async () => {
    process.env.REDIS_HOST = 'localhost'
    delete process.env.REDIS_PORT
    const options = require('../cache.js').config()
    expect(options).toMatchObject({
      store: expect.objectContaining({}),
      host: 'localhost',
      port: 6379,
      ttl: 60 * 60 * 12
    })
  })

  it('uses an in-memory store if no redis configuration is provided', async () => {
    delete process.env.REDIS_HOST
    delete process.env.REDIS_PORT
    const options = require('../cache.js').config()
    expect(options).toMatchObject({
      store: 'memory',
      ttl: 60 * 60 * 12
    })
  })
})
