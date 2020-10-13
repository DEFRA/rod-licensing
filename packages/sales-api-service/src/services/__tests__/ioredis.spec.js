import Redis from 'ioredis'

describe('ioredis service', () => {
  beforeEach(jest.clearAllMocks)

  it('is constructed with defaults when no environment settings are present', () => {
    jest.isolateModules(() => {
      require('../ioredis.service.js')
      expect(Redis).toHaveBeenLastCalledWith({
        host: 'localhost',
        port: 6379
      })
    })
  })

  it('is constructed according to the environment settings when defined', () => {
    jest.isolateModules(() => {
      process.env.REDIS_HOST = 'test-host'
      process.env.REDIS_PORT = '1234'
      process.env.REDIS_PASSWORD = 'open-sesame'
      require('../ioredis.service.js')
      expect(Redis).toHaveBeenLastCalledWith({
        host: 'test-host',
        port: '1234',
        password: 'open-sesame',
        tls: {}
      })
    })
  })

  it('exposes a redis instance', () => {
    jest.isolateModules(() => {
      expect(require('../ioredis.service.js').redis).toBeInstanceOf(Redis)
    })
  })
})
