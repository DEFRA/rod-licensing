import FtpClient from 'ssh2-sftp-client'
import moment from 'moment'
import Path from 'path'
import fs from 'fs'
import db from 'debug'
import { updateFileStagingTable } from '../io/db.js'
import { getTempDir } from '../io/file.js'
import { FILE_STAGE } from '../staging/constants.js'
import { SFTP_KEY_EXCHANGE_ALGORITHMS, SFTP_CIPHERS } from './constants.js'
import { AWS } from '@defra-fish/connectors-lib'
import md5File from 'md5-file'
const { s3 } = AWS()

const debug = db('pocl:transport')
const sftp = new FtpClient()

const config = {
  host: process.env.POCL_FTP_HOST,
  port: process.env.POCL_FTP_PORT,
  username: process.env.POCL_FTP_USERNAME,
  privateKey: fs.readFileSync(process.env.POCL_FTP_PRIVATE_KEY_PATH),
  algorithms: { cipher: SFTP_CIPHERS, kex: SFTP_KEY_EXCHANGE_ALGORITHMS },
  // Wait up to 60 seconds for the SSH handshake
  readyTimeout: 60000,
  // Retry 5 times over a minute
  retries: 5,
  retry_minTimeout: 12000,
  debug: db('pocl:ftp')
}

export async function ftpToS3 () {
  const tempDir = getTempDir('ftp')
  try {
    debug('Connecting to SFTP endpoint with configuration %O', config)
    await sftp.connect(config)
    const fileList = await sftp.list(process.env.POCL_FTP_PATH)
    debug('Discovered the following files on the SFTP server: %O', fileList)
    const xmlFiles = fileList.filter(f => Path.extname(f.name).toLowerCase() === '.xml')

    if (!xmlFiles.length) {
      debug('No XML files were waiting to be processed on the SFTP server.')
    } else {
      for (const fileEntry of xmlFiles) {
        const remoteFilePath = Path.resolve(process.env.POCL_FTP_PATH, fileEntry.name)
        const localFilePath = Path.resolve(tempDir, fileEntry.name)

        // Retrieve from FTP server to local temporary directory
        debug('Transferring %s to %s', remoteFilePath, localFilePath)
        await sftp.fastGet(remoteFilePath, localFilePath, {})

        // Transfer to S3
        const s3Key = Path.join(moment().format('YYYY-MM-DD'), fileEntry.name)
        debug('Transferring file to S3 bucket %s with key %s', process.env.POCL_S3_BUCKET, s3Key)
        await s3
          .putObject({
            Bucket: process.env.POCL_S3_BUCKET,
            Key: s3Key,
            Body: fs.createReadStream(localFilePath)
          })
          .promise()

        // Record as pending to be processed
        const md5 = await md5File(localFilePath)
        await updateFileStagingTable({ filename: fileEntry.name, md5, stage: FILE_STAGE.Pending, s3Key: s3Key })

        // Remove from FTP server and local tmp
        debug('Removing remote file %s', remoteFilePath)
        await sftp.delete(remoteFilePath)
        fs.unlinkSync(localFilePath)
      }
    }
  } catch (e) {
    console.error('Error migrating files from the SFTP endpoint', e)
    throw e
  } finally {
    debug('Closing SFTP connection.')
    await sftp.end()
  }
}
