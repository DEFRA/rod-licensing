import AwsMock from 'aws-sdk'
import config from '../config.js'

describe('config', () => {
  beforeAll(async () => {
    AwsMock.SecretsManager.__setResponse('getSecretValue', {
      SecretString: 'test-ssh-key'
    })

    process.env.POCL_FILE_STAGING_TABLE = 'test-file-staging-table'
    process.env.POCL_RECORD_STAGING_TABLE = 'test-record-staging-table'
    process.env.POCL_STAGING_TTL = 1234

    process.env.POCL_S3_BUCKET = 'test-bucket'
    await config.initialise()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('db', () => {
    it('provides properties relating to dynamodb', async () => {
      expect(config.db.fileStagingTable).toEqual('test-file-staging-table')
      expect(config.db.recordStagingTable).toEqual('test-record-staging-table')
      expect(config.db.stagingTtlDelta).toEqual(1234)
    })

    it('defaults the staging ttl if none is set', async () => {
      delete process.env.POCL_STAGING_TTL
      await config.initialise()
      expect(config.db.stagingTtlDelta).toEqual(60 * 60 * 168)
    })
  })

  describe('s3', () => {
    it('provides properties relating the use of Amazon S3', async () => {
      expect(config.s3.bucket).toEqual('test-bucket')
    })
  })
})
