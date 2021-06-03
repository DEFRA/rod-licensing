import AwsMock from 'aws-sdk'
import config from '../config.js'
import { AWS } from '@defra-fish/connectors-lib'
const { secretsManager } = AWS()

const setEnvVars = () => {
  for (const envVar in envVars) {
    process.env[envVar] = envVars[envVar]
  }
}

const clearEnvVars = () => {
  for (const key in envVars) {
    delete process.env[key]
  }
}

const envVars = Object.freeze({
  FULFILMENT_FILE_SIZE: 1234,
  FULFILMENT_FTP_HOST: 'test-host',
  FULFILMENT_FTP_PORT: 2222,
  FULFILMENT_FTP_PATH: '/remote/share',
  FULFILMENT_FTP_USERNAME: 'test-user',
  FULFILMENT_FTP_KEY_SECRET_ID: 'test-secret-id',
  FULFILMENT_S3_BUCKET: 'test-bucket',
  FULFILMENT_PGP_PUBLIC_KEY_SECRET_ID: 'pgp-key-secret-id',
  FULFILMENT_SEND_UNENCRYPTED_FILE: 'false'
})

describe('config', () => {
  beforeAll(async () => {
    AwsMock.SecretsManager.__setResponse('getSecretValue', {
      SecretString: 'test-ssh-key'
    })
    setEnvVars()
    await config.initialise()
  })
  beforeEach(jest.clearAllMocks)
  afterAll(clearEnvVars)

  describe('file', () => {
    it('provides properties relating to the fulfilment file', async () => {
      expect(config.file.size).toEqual(1234)
    })
  })

  describe('ftp', () => {
    it('provides properties relating the use of SFTP', async () => {
      expect(config.ftp).toEqual(
        expect.objectContaining({
          host: 'test-host',
          port: '2222',
          path: '/remote/share',
          username: 'test-user',
          privateKey: 'test-ssh-key',
          algorithms: { cipher: expect.any(Array), kex: expect.any(Array) },
          // Wait up to 60 seconds for the SSH handshake
          readyTimeout: expect.any(Number),
          // Retry 5 times over a minute
          retries: expect.any(Number),
          retry_minTimeout: expect.any(Number),
          debug: expect.any(Function)
        })
      )
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

describe('pgp config', () => {
  const init = async (samplePublicKey = 'sample-pgp-key') => {
    AwsMock.SecretsManager.__setNextResponses('getSecretValue', { SecretString: 'test-ssh-key' }, { SecretString: samplePublicKey })
    await config.initialise()
  }
  beforeAll(setEnvVars)
  beforeEach(jest.clearAllMocks)
  afterAll(clearEnvVars)

  it.each(['public-pgp-key', 'paragon-sample-key', 'keep-me-secret'])('gets pgp key (%s) from secrets manager', async sampleKey => {
    await init(sampleKey)
    expect(config.pgp.publicKey).toEqual(sampleKey)
  })

  it.each(['secret-id-abc', 'pgp-public-key-secret-id', '123-secret-id'])(
    'pgp key obtained from aws secrets manager (%s)',
    async SecretId => {
      process.env.FULFILMENT_PGP_PUBLIC_KEY_SECRET_ID = SecretId
      await init()
      expect(secretsManager.getSecretValue).toHaveBeenCalledWith(
        expect.objectContaining({
          SecretId
        })
      )
    }
  )

  it.each([
    ['true', true],
    ['false', false],
    ['TrUe', true],
    ['fAlSe', false],
    [1, true],
    [0, false],
    [111, true],
    ['yes', true],
    ['no', true]
  ])('PGP send unencrypted file flag is %s, evaluates to $s', async (env, flag) => {
    process.env.FULFILMENT_SEND_UNENCRYPTED_FILE = env
    await init()
    expect(config._pgp.sendUnencryptedFile).toEqual(flag)
  })
})
