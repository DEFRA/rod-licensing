import config from '../config.js'
import { AWS } from '@defra-fish/connectors-lib'
const { systemsManager, GetParameterCommand } = AWS.mock.results[0].value

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    GetParameterCommand: jest.fn(),
    systemsManager: {
      send: jest.fn(() => ({ Value: 'test-ssh-key' }))
    }
  }))
}))

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
  FULFILMENT_S3_BUCKET: 'test-bucket',
  FULFILMENT_PGP_PUBLIC_KEY_SECRET_ID: 'pgp-key-secret-id',
  FULFILMENT_SEND_UNENCRYPTED_FILE: 'false'
})

describe('config', () => {
  beforeAll(async () => {
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

  describe('s3', () => {
    it('provides properties relating the use of Amazon S3', async () => {
      expect(config.s3.bucket).toEqual('test-bucket')
    })
  })
})

describe('pgp config', () => {
  const init = async (samplePublicKey = 'sample-pgp-key') => {
    systemsManager.send.mockResolvedValueOnce({ Value: samplePublicKey })
    await config.initialise()
  }
  beforeAll(setEnvVars)
  beforeEach(jest.clearAllMocks)
  afterAll(clearEnvVars)

  it.each(['secret-id-abc', 'pgp-public-key-secret-id', '123-secret-id'])(
    'prepares to request the pgp key (%s) from AWS Systems Manager',
    async Name => {
      process.env.FULFILMENT_PGP_PUBLIC_KEY_SECRET_ID = Name
      await init()
      expect(GetParameterCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Name
        })
      )
    }
  )

  it('requests the pgp key from Systems Manager', async () => {
    await init()
    expect(systemsManager.send).toHaveBeenCalledWith(expect.any(GetParameterCommand))
  })

  it.each(['public-pgp-key', 'paragon-sample-key', 'keep-me-secret'])(
    'uses the pgp key (%s) retrieved from Systems Manager',
    async sampleKey => {
      await init(sampleKey)
      expect(config.pgp.publicKey).toEqual(sampleKey)
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
