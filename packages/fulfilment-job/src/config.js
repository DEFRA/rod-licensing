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
const falseRegEx = /(false|0)/i
const trueRegEx = /(true|1)/i
const toBoolean = val => {
  if (falseRegEx.test(val)) {
    return false
  }
  if (trueRegEx.test(val)) {
    return true
  }
  return !!val
}

class Config {
  _file
  _ftp
  _s3
  _pgp

  async initialise () {
    console.log('initialising config')
    this.file = {
      size: Number.parseInt(process.env.FULFILMENT_FILE_SIZE),
      /**
       * Maximum buffer size before writing to a part file.
       * This is capped at 999 as the maximum size of a batch request to Dynamics is 1000 and we need to create the FulfilmentRequestFile entity as
       * part of the same request, leaving room to update 999 FulfilmentRequest entities
       */
      partFileSize: Math.min(Number.parseInt(process.env.FULFILMENT_FILE_SIZE), 999)
    }
    console.log('set file', this.file)
    this.ftp = {
      host: process.env.FULFILMENT_FTP_HOST,
      port: process.env.FULFILMENT_FTP_PORT || '22',
      path: process.env.FULFILMENT_FTP_PATH,
      username: process.env.FULFILMENT_FTP_USERNAME,
      privateKey: (await secretsManager.getSecretValue({ SecretId: process.env.FULFILMENT_FTP_KEY_SECRET_ID }).promise()).SecretString,
      algorithms: { cipher: SFTP_CIPHERS, kex: SFTP_KEY_EXCHANGE_ALGORITHMS },
      // Wait up to 60 seconds for the SSH handshake
      readyTimeout: 60000,
      // Retry 5 times over a minute
      retries: 5,
      retry_minTimeout: 12000,
      debug: db('fulfilment:ftp')
    }
    console.log('set ftp', this.ftp)
    this.s3 = {
      bucket: process.env.FULFILMENT_S3_BUCKET
    }
    console.log('set s3', this.s3)
    this._pgp = {
      publicKey: (await secretsManager.getSecretValue({ SecretId: process.env.FULFILMENT_PGP_PUBLIC_KEY_SECRET_ID }).promise()).SecretString,
      sendUnencryptedFile: toBoolean(process.env.FULFILMENT_SEND_UNENCRYPTED_FILE)
    }
    console.log('set pgp', this._pgp)
  }

  /**
   * Fulfilment file configuration settings
   * @type {object}
   */
  get file () {
    return this._file
  }

  set file (cfg) {
    this._file = cfg
  }

  /**
   * FTP configuration settings
   * @type {object}
   */
  get ftp () {
    return this._ftp
  }

  set ftp (cfg) {
    this._ftp = cfg
  }

  /**
   * S3 configuration settings
   * @type {object}
   */
  get s3 () {
    return this._s3
  }

  set s3 (cfg) {
    this._s3 = cfg
  }

  get pgp () {
    return this._pgp
  }
}
export default new Config()
