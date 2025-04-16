import moment from 'moment'
import filesize from 'filesize'
import config from '../config.js'
import { DYNAMICS_IMPORT_STAGE } from '../staging/constants.js'
import { storeS3Metadata } from '../transport/storeS3MetaData.js'
import { AWS, salesApi } from '@defra-fish/connectors-lib'
const { s3 } = AWS()

const listObjectsV2 = async function (params) {
  try {
    return await s3.listObjectsV2(params)
  } catch (e) {
    console.error(e)
    throw e
  }
}

const getS3FileList = async function (token, fileList = []) {
  const params = {
    Bucket: config.s3.bucket,
    ContinuationToken: token
  }
  const bucketList = await listObjectsV2(params)
  if (bucketList && bucketList.Contents) {
    fileList = fileList.concat(bucketList.Contents)
    if (bucketList.IsTruncated) {
      return getS3FileList(bucketList.NextContinuationToken, fileList)
    }
  } else {
    console.warn('S3 bucket contains no objects')
  }
  return fileList
}

/**
 * Update the POCL file staging table to add or update missing files in S3
 *
 * @returns {Promise<void>}
 */
export const refreshS3Metadata = async () => {
  const fileList = await getS3FileList()
  const recentFiles = fileList.filter(file => moment(new Date(file.LastModified)) > moment().subtract(1, 'days'))

  console.log(`Processing ${recentFiles.length} S3 files`)

  for (const file of recentFiles) {
    const filename = file.Key.split('/').pop()

    console.log(`Processing ${filename}`)

    const dynamicsRecord = await salesApi.getTransactionFile(filename)
    if (!dynamicsRecord || !DYNAMICS_IMPORT_STAGE.isAlreadyProcessed(dynamicsRecord.status.description)) {
      await storeS3Metadata(file.ETag, filesize(file.Size), filename, file.Key, moment(new Date(file.LastModified)))
    } else {
      console.log(`${file.Key} is already processed, skipping`)
    }
  }

  console.log('Processed S3 files')
}
