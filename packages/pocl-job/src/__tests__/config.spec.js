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

    process.env.POCL_FTP_HOST = 'test-host'
    process.env.POCL_FTP_PORT = 2222
    process.env.POCL_FTP_PATH = '/remote/share'
    process.env.POCL_FTP_USERNAME = 'test-user'
    process.env.POCL_FTP_KEY_SECRET_ID = 'test-secret-id'
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

  describe('ftp', () => {
    it('is an asynchronous function to retrieve ftp configuration values', async () => {
      expect(config.ftp.host).toEqual('test-host')
      expect(config.ftp.port).toEqual('2222')
      expect(config.ftp.path).toEqual('/remote/share')
      expect(config.ftp.username).toEqual('test-user')
      expect(config.ftp.privateKey).toEqual('test-ssh-key')
    })
    it('defaults the sftp port to 22 if the environment variable is not configured', async () => {
      delete process.env.POCL_FTP_PORT
      await config.initialise()
      expect(config.ftp.port).toEqual('22')
    })
  })

  describe('s3', () => {
    it('provides properties relating the use of Amazon S3', async () => {
      expect(config.s3.bucket).toEqual('test-bucket')
    })
  })
})
