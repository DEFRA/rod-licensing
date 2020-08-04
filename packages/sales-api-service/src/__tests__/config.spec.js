describe('config', () => {
  beforeEach(() => {
    process.env = {}
  })

  describe('SERVER', () => {
    it('provides a default configuration', async () => {
      jest.isolateModules(() => {
        const config = require('../config.js')
        expect(config.SERVER).toEqual({
          Port: 4000,
          KeepAliveTimeout: 60000
        })
      })
    })

    it('can be customised via environment variables', async () => {
      jest.isolateModules(() => {
        process.env.PORT = '4000'
        process.env.HAPI_KEEP_ALIVE_TIMEOUT_MS = '5000'
        const config = require('../config.js')
        expect(config.SERVER).toEqual({
          Port: 4000,
          KeepAliveTimeout: 5000
        })
      })
    })

    it('throws if the configuration is invalid', async () => {
      jest.isolateModules(() => {
        process.env.PORT = 'Not a Number'
        process.env.HAPI_KEEP_ALIVE_TIMEOUT_MS = 'Not a Number'
        expect(() => require('../config.js')).toThrow()
      })
    })
  })

  describe('PAYMENTS_TABLE', () => {
    it('provides a default configuration', async () => {
      jest.isolateModules(() => {
        const config = require('../config.js')
        expect(config.PAYMENTS_TABLE).toEqual({
          TableName: 'PaymentJournals',
          Ttl: 604800
        })
      })
    })

    it('can be customised via environment variables', async () => {
      jest.isolateModules(() => {
        process.env.PAYMENT_JOURNALS_TABLE = 'TestTable'
        process.env.PAYMENT_JOURNALS_TABLE_TTL = '123'
        const config = require('../config.js')
        expect(config.PAYMENTS_TABLE).toEqual({
          TableName: 'TestTable',
          Ttl: 123
        })
      })
    })

    it('throws if the configuration is invalid', async () => {
      jest.isolateModules(() => {
        process.env.PAYMENT_JOURNALS_TABLE = ' '
        process.env.PAYMENT_JOURNALS_TABLE_TTL = ' '
        expect(() => require('../config.js')).toThrow()
      })
    })
  })

  describe('TRANSACTION_STAGING_TABLE', () => {
    it('provides a default configuration', async () => {
      jest.isolateModules(() => {
        const config = require('../config.js')
        expect(config.TRANSACTION_STAGING_TABLE).toEqual({
          TableName: 'TransactionStaging',
          Ttl: 604800,
          StagingErrorsTtl: 31536000
        })
      })
    })

    it('can be customised via environment variables', async () => {
      jest.isolateModules(() => {
        process.env.TRANSACTION_STAGING_TABLE = 'TestTable'
        process.env.TRANSACTION_STAGING_TABLE_TTL = '123'
        const config = require('../config.js')
        expect(config.TRANSACTION_STAGING_TABLE).toEqual({
          TableName: 'TestTable',
          Ttl: 123,
          StagingErrorsTtl: 31536000
        })
      })
    })

    it('throws if the configuration is invalid', async () => {
      jest.isolateModules(() => {
        process.env.TRANSACTION_STAGING_TABLE = ' '
        process.env.TRANSACTION_STAGING_TABLE_TTL = ' '
        expect(() => require('../config.js')).toThrow()
      })
    })
  })

  describe('TRANSACTION_STAGING_HISTORY_TABLE', () => {
    it('provides a default configuration', async () => {
      jest.isolateModules(() => {
        const config = require('../config.js')
        expect(config.TRANSACTION_STAGING_HISTORY_TABLE).toEqual({
          TableName: 'TransactionStagingHistory',
          Ttl: 7776000
        })
      })
    })

    it('can be customised via environment variables', async () => {
      jest.isolateModules(() => {
        process.env.TRANSACTION_STAGING_HISTORY_TABLE = 'TestTable'
        process.env.TRANSACTION_STAGING_HISTORY_TABLE_TTL = '123'
        const config = require('../config.js')
        expect(config.TRANSACTION_STAGING_HISTORY_TABLE).toEqual({
          TableName: 'TestTable',
          Ttl: 123
        })
      })
    })

    it('throws if the configuration is invalid', async () => {
      jest.isolateModules(() => {
        process.env.TRANSACTION_STAGING_HISTORY_TABLE = ' '
        process.env.TRANSACTION_STAGING_HISTORY_TABLE_TTL = ' '
        expect(() => require('../config.js')).toThrow()
      })
    })
  })

  describe('TRANSACTION_QUEUE', () => {
    it('provides a default configuration', async () => {
      jest.isolateModules(() => {
        const config = require('../config.js')
        expect(config.TRANSACTION_QUEUE).toEqual({
          Url: 'http://0.0.0.0:9324/queue/TransactionsQueue.fifo'
        })
      })
    })

    it('can be customised via environment variables', async () => {
      jest.isolateModules(() => {
        process.env.TRANSACTION_QUEUE_URL = 'http://test-host:1234'
        const config = require('../config.js')
        expect(config.TRANSACTION_QUEUE).toEqual({
          Url: 'http://test-host:1234'
        })
      })
    })

    it('throws if the configuration is invalid', async () => {
      jest.isolateModules(() => {
        process.env.TRANSACTION_QUEUE_URL = ' '
        expect(() => require('../config.js')).toThrow()
      })
    })
  })
})
