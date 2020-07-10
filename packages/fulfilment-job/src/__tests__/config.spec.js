import AwsMock from 'aws-sdk'
import config from '../config.js'

describe('config', () => {
  beforeAll(async () => {
    AwsMock.SecretsManager.__setResponse('getSecretValue', {
      SecretString: 'test-ssh-key'
    })
    process.env.FULFILMENT_FILE_SIZE = 1234
    process.env.FULFILMENT_FTP_HOST = 'test-host'
    process.env.FULFILMENT_FTP_PORT = 2222
    process.env.FULFILMENT_FTP_PATH = '/remote/share'
    process.env.FULFILMENT_FTP_USERNAME = 'test-user'
    process.env.FULFILMENT_FTP_KEY_SECRET_ID = 'test-secret-id'
    process.env.FULFILMENT_S3_BUCKET = 'test-bucket'
    await config.initialise()
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('file', () => {
    it('provides properties relating to the fulfilment file', async () => {
      expect(config.file.size).toEqual(1234)
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
      delete process.env.FULFILMENT_FTP_PORT
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
