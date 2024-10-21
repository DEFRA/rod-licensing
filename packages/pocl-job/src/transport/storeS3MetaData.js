
import moment from 'moment'
import { salesApi } from '@defra-fish/connectors-lib'
import { DYNAMICS_IMPORT_STAGE, FILE_STAGE, POST_OFFICE_DATASOURCE } from '../staging/constants.js'
import { updateFileStagingTable } from '../io/db.js'

export async function storeS3Metadata (md5, fileSize, filename, s3Key, receiptMoment) {
  console.log(`Storing metadata for ${s3Key}`)
  await updateFileStagingTable({ filename, md5, fileSize, s3Key, stage: FILE_STAGE.Pending })

  await salesApi.upsertTransactionFile(filename, {
    status: DYNAMICS_IMPORT_STAGE.Pending,
    dataSource: POST_OFFICE_DATASOURCE,
    fileSize: fileSize,
    salesDate: moment(receiptMoment).subtract(1, 'days').toISOString(),
    receiptTimestamp: receiptMoment.toISOString(),
    notes: 'Retrieved from the remote server and awaiting processing'
  })

  console.log(`Stored metadata for ${s3Key}`)
}
