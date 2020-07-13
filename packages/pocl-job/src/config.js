import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
const { secretsManager } = AWS()

/**
 * Key exchange algorithms for public key authentication - in descending order of priority
 * @type {string[]}
 */
export const SFTP_KEY_EXCHANGE_ALGORITHMS = [
  'curve25519-sha256@libssh.org',
  'curve25519-sha256',
  'ecdh-sha2-nistp521',
  'ecdh-sha2-nistp384',
  'ecdh-sha2-nistp256',
  'diffie-hellman-group-exchange-sha256',
  'diffie-hellman-group14-sha256',
  'diffie-hellman-group16-sha512',
  'diffie-hellman-group18-sha512',
  'diffie-hellman-group14-sha1',
  'diffie-hellman-group-exchange-sha1',
  'diffie-hellman-group1-sha1'
]
/**
 * Ciphers for SFTP support - in descending order of priority
 * @type {string[]}
 */
export const SFTP_CIPHERS = [
  // http://tools.ietf.org/html/rfc4344#section-4
  'aes256-ctr',
  'aes192-ctr',
  'aes128-ctr',
  'aes256-gcm',
  'aes256-gcm@openssh.com',
  'aes128-gcm',
  'aes128-gcm@openssh.com',
  'aes256-cbc',
  'aes192-cbc',
  'aes128-cbc',
  'blowfish-cbc',
  '3des-cbc',
  'cast128-cbc'
]

class Config {
  _db
  _ftp
  _s3

  async initialise () {
    this._db = {
      fileStagingTable: process.env.POCL_FILE_STAGING_TABLE,
      recordStagingTable: process.env.POCL_RECORD_STAGING_TABLE,
      stagingTtlDelta: Number.parseInt(process.env.POCL_STAGING_TTL || 60 * 60 * 168)
    }

    this._ftp = {
      host: process.env.POCL_FTP_HOST,
      port: process.env.POCL_FTP_PORT || '22',
      path: process.env.POCL_FTP_PATH,
      username: process.env.POCL_FTP_USERNAME,
      privateKey: (await secretsManager.getSecretValue({ SecretId: process.env.POCL_FTP_KEY_SECRET_ID }).promise()).SecretString,
      algorithms: { cipher: SFTP_CIPHERS, kex: SFTP_KEY_EXCHANGE_ALGORITHMS },
      // Wait up to 60 seconds for the SSH handshake
      readyTimeout: 60000,
      // Retry 5 times over a minute
      retries: 5,
      retry_minTimeout: 12000,
      debug: db('pocl:ftp')
    }

    this._s3 = {
      bucket: process.env.POCL_S3_BUCKET
    }
  }

  /**
   * Database configuration settings
   * @type {object}
   * @readonly
   */
  get db () {
    return this._db
  }

  /**
   * FTP configuration settings
   * @type {object}
   * @readonly
   */
  get ftp () {
    return this._ftp
  }

  /**
   * S3 configuration settings
   * @type {object}
   * @readonly
   */
  get s3 () {
    return this._s3
  }
}
export default new Config()
