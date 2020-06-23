import FtpClient from 'ssh2-sftp-client'
import Path from 'path'
import { PassThrough } from 'stream'
import db from 'debug'
import { SFTP_KEY_EXCHANGE_ALGORITHMS, SFTP_CIPHERS } from './constants.js'
import config from '../config.js'
const debug = db('fulfilment:transport')

const ftpCfg = {
  ...config.ftp,
  algorithms: { cipher: SFTP_CIPHERS, kex: SFTP_KEY_EXCHANGE_ALGORITHMS },
  // Wait up to 60 seconds for the SSH handshake
  readyTimeout: 60000,
  // Retry 5 times over a minute
  retries: 5,
  retry_minTimeout: 12000,
  debug: db('fulfilment:ftp')
}

/**
 * Create a stream to write to the configured FTP server
 *
 * @param {string} filename The name of the file to be written to the remote server
 * @returns {{ftpWriteStream: module:stream.internal.PassThrough, managedUpload: Promise<*>}}
 */
export const createFtpWriteStream = filename => {
  const sftp = new FtpClient()
  const passThrough = new PassThrough()
  const remoteFilePath = Path.join(config.ftp.path, filename)
  return {
    ftpWriteStream: passThrough,
    managedUpload: sftp
      .connect(ftpCfg)
      .then(() => sftp.put(passThrough, remoteFilePath, { flags: 'w', encoding: 'UTF-8', autoClose: false }))
      .then(() => debug('File successfully uploaded to fulfilment provider at sftp://%s:%s%s', ftpCfg.host, ftpCfg.port, remoteFilePath))
      .finally(() => sftp.end())
  }
}
