import { promisify } from 'util'
import { pipeline, PassThrough } from 'stream'
import { fulfilmentDataTransformer } from '../transform/fulfilment-transform.js'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
import config from '../config.js'
const pipelinePromise = promisify(pipeline)
const debug = db('fulfilment:transport')
const { s3 } = AWS()

/**
 * Write a fulfilment part file to S3
 *
 * @param {FulfilmentRequestFile} fulfilmentRequestFile The fulfilment request file being processed
 * @param {number} partNumber the part number being written
 * @param {Array<FulfilmentDataEntry>} data The entries to be written to the file
 * @returns {Promise<*>}
 */
export const writeS3PartFile = async (fulfilmentRequestFile, partNumber, data) => {
  const key = `${fulfilmentRequestFile.fileName}/part${partNumber}`
  debug('Writing %d items to S3 using key %s', data.length, key)
  const { s3WriteStream, managedUpload } = createS3WriteStream(key)
  await Promise.all([pipelinePromise([data, fulfilmentDataTransformer, s3WriteStream]), managedUpload])
}

/**
 * Read fulfilment request part files from S3 for the given FulfilmentRequestFile
 *
 * @param {FulfilmentRequestFile} fulfilmentRequestFile The fulfilment request file being processed
 * @returns {Array<stream.Readable>} Readable streams for each of the part files
 */
export async function readS3PartFiles (fulfilmentRequestFile) {
  const { Contents: files } = await s3.listObjectsV2({ Bucket: config.s3.bucket, Prefix: `${fulfilmentRequestFile.fileName}/` })
  return files
    .filter(f => /part\d+$/.test(f.Key))
    .map(f => {
      const s3rs = s3.getObject({ Bucket: config.s3.bucket, Key: f.Key }).createReadStream()
      s3rs.setEncoding('utf8')
      return s3rs
    })
}

/**
 * Create a stream to write data to S3
 * @param {string} key The object key to write data to, existing data will be overwritten
 * @returns {{s3WriteStream: WritableStream, managedUpload: Promise<ManagedUpload.SendData>}}
 */
export const createS3WriteStream = key => {
  const passThrough = new PassThrough()
  return {
    s3WriteStream: passThrough,
    managedUpload: s3
      .upload({ Bucket: config.s3.bucket, Key: key, Body: passThrough })
      .then(data => debug(`File successfully uploaded to S3 at ${data.Location}`))
  }
}
