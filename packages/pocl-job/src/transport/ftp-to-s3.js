import FtpClient from 'ssh2-sftp-client'
import moment from 'moment'
import Path from 'path'
import fs from 'fs'
import db from 'debug'
import { updateFileStagingTable } from '../io/db.js'
import { getTempDir } from '../io/file.js'
import { DYNAMICS_IMPORT_STAGE, FILE_STAGE, POST_OFFICE_DATASOURCE } from '../staging/constants.js'
import { SFTP_KEY_EXCHANGE_ALGORITHMS, SFTP_CIPHERS } from './constants.js'
import { AWS, salesApi } from '@defra-fish/connectors-lib'
import md5File from 'md5-file'
import filesize from 'filesize'
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
  try {
    debug('Connecting to SFTP endpoint with configuration %O', config)
    await sftp.connect(config)
    const fileList = await sftp.list(process.env.POCL_FTP_PATH)
    debug('Discovered the following files on the SFTP server: %O', fileList)
    const xmlFiles = fileList.filter(f => Path.extname(f.name).toLowerCase() === '.xml')

    if (!xmlFiles.length) {
      debug('No XML files were waiting to be processed on the SFTP server.')
    } else {
      await retrieveAllFiles(xmlFiles)
    }
  } catch (e) {
    console.error('Error migrating files from the SFTP endpoint', e)
    throw e
  } finally {
    debug('Closing SFTP connection.')
    await sftp.end()
  }
}

const retrieveAllFiles = async xmlFiles => {
  const tempDir = getTempDir('ftp')

  for (const fileEntry of xmlFiles) {
    const filename = fileEntry.name
    const remoteFilePath = Path.join(process.env.POCL_FTP_PATH, filename)
    const localFilePath = Path.resolve(tempDir, filename)

    // Retrieve from FTP server to local temporary directory
    debug('Transferring %s to %s', remoteFilePath, localFilePath)
    await sftp.fastGet(remoteFilePath, localFilePath, {})

    // Transfer to S3
    const receiptMoment = moment()
    const s3Key = Path.join(receiptMoment.format('YYYY-MM-DD'), filename)
    debug('Transferring file to S3 bucket %s with key %s', process.env.POCL_S3_BUCKET, s3Key)
    await s3.putObject({ Bucket: process.env.POCL_S3_BUCKET, Key: s3Key, Body: fs.createReadStream(localFilePath) }).promise()

    const dynamicsRecord = await salesApi.getTransactionFile(filename)
    if (dynamicsRecord && DYNAMICS_IMPORT_STAGE.isAlreadyProcessed(dynamicsRecord.status.description)) {
      console.error(
        'Retrieved file %s from SFTP and stored in S3, however an entry already exists in Dynamics with this filename.  Skipping import.',
        filename
      )
    } else {
      // Record as pending to be processed
      const md5 = await md5File(localFilePath)
      const fileSize = filesize(fs.statSync(localFilePath).size)
      await updateFileStagingTable({ filename, md5, fileSize, stage: FILE_STAGE.Pending, s3Key: s3Key })

      await salesApi.upsertTransactionFile(filename, {
        status: DYNAMICS_IMPORT_STAGE.Pending,
        dataSource: POST_OFFICE_DATASOURCE,
        fileSize: fileSize,
        salesDate: receiptMoment.toISOString(),
        receiptTimestamp: receiptMoment.toISOString(),
        notes: 'Retrieved from the remote server and awaiting processing'
      })
    }

    // Remove from FTP server and local tmp
    debug('Removing remote file %s', remoteFilePath)
    await sftp.delete(remoteFilePath)
    fs.unlinkSync(localFilePath)
  }
}
