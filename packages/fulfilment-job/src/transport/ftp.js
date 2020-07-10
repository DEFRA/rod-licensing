import FtpClient from 'ssh2-sftp-client'
import Path from 'path'
import { PassThrough } from 'stream'
import config from '../config.js'
import db from 'debug'
const debug = db('fulfilment:transport')

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
      .connect(config.ftp)
      .then(() => sftp.put(passThrough, remoteFilePath, { flags: 'w', encoding: 'UTF-8', autoClose: false }))
      .then(() =>
        debug('File successfully uploaded to fulfilment provider at sftp://%s:%s%s', config.ftp.host, config.ftp.port, remoteFilePath)
      )
      .finally(() => sftp.end())
  }
}
