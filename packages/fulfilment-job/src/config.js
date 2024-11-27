import { AWS } from '@defra-fish/connectors-lib'

const { secretsManager } = AWS()
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
  _s3
  _pgp

  async initialise () {
    this.file = {
      size: Number.parseInt(process.env.FULFILMENT_FILE_SIZE),
      /**
       * Maximum buffer size before writing to a part file.
       * This is capped at 999 as the maximum size of a batch request to Dynamics is 1000 and we need to create the FulfilmentRequestFile entity as
       * part of the same request, leaving room to update 999 FulfilmentRequest entities
       */
      partFileSize: Math.min(Number.parseInt(process.env.FULFILMENT_FILE_SIZE), 999)
    }
    this.s3 = {
      bucket: process.env.FULFILMENT_S3_BUCKET
    }
    this._pgp = {
      publicKey: (await secretsManager.getSecretValue({ SecretId: process.env.FULFILMENT_PGP_PUBLIC_KEY_SECRET_ID }).promise())
        .SecretString,
      sendUnencryptedFile: toBoolean(process.env.FULFILMENT_SEND_UNENCRYPTED_FILE)
    }
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
