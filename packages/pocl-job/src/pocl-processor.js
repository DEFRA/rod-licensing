import config from './config.js'
import { ftpToS3 } from './transport/ftp-to-s3.js'
import { s3ToLocal } from './transport/s3-to-local.js'
import { getFileRecords } from './io/db.js'
import { removeTemp } from './io/file.js'
import { stage } from './staging/pocl-data-staging.js'
import { FILE_STAGE } from './staging/constants.js'

import db from 'debug'
const debug = db('pocl:processor')

export async function execute () {
  try {
    await config.initialise()
    debug('Retrieving files from FTP')
    await ftpToS3()
    const pendingFileRecords = await getFileRecords(FILE_STAGE.Pending, FILE_STAGE.Staging, FILE_STAGE.Finalising)
    debug('Found %s files remaining to be processed', pendingFileRecords.length)
    const localXmlFiles = await Promise.all(pendingFileRecords.map(record => s3ToLocal(record.s3Key)))
    debug('Processing files: %O', localXmlFiles)
    await Promise.all(localXmlFiles.map(f => stage(f)))
  } finally {
    removeTemp()
  }
}
