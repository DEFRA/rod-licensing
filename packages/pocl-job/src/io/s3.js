import moment from 'moment'
import filesize from 'filesize'
import config from '../config.js'
import { DYNAMICS_IMPORT_STAGE } from '../staging/constants.js'
import { storeS3Metadata } from '../transport/ftp-to-s3'
import { AWS, salesApi } from '@defra-fish/connectors-lib'
const { s3 } = AWS()

const getS3FileList = async function (token, fileList = []) {
  const params = {
    Bucket: config.s3 ? config.s3.bucket : undefined,
    ContinuationToken: token
  }
  const bucketList = await s3.listObjectsV2(params).promise()
  return bucketList ? bucketList.Contents : []
}

/**
 * Update the POCL file staging table to add or update missing files in S3
 *
 * @returns {Promise<void>}
 */
export const refreshS3Metadata = async () => {
  const fileList = await getS3FileList()
  for (const file of fileList) {
    const dynamicsRecord = await salesApi.getTransactionFile(file.Key)
    if (!dynamicsRecord || !DYNAMICS_IMPORT_STAGE.isAlreadyProcessed(dynamicsRecord.status.description)) {
      await storeS3Metadata(file.ETag, filesize(file.Size), file.Key.split('/').pop(), file.Key, moment(new Date(file.LastModified)))
    }
  }
}
