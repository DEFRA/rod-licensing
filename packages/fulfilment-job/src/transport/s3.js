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
  return pipelinePromise([data, fulfilmentDataTransformer, createS3WriteStream(key)])
}

/**
 * Read fulfilment request part files from S3 for the given FulfilmentRequestFile
 *
 * @param {FulfilmentRequestFile} fulfilmentRequestFile The fulfilment request file being processed
 * @returns {Array<stream.Readable>} Readable streams for each of the part files
 */
export async function readS3PartFiles (fulfilmentRequestFile) {
  const { Contents: files } = await s3.listObjectsV2({ Bucket: config.s3.bucket, Prefix: `${fulfilmentRequestFile.fileName}/` }).promise()
  return files.filter(f => /part\d+$/.test(f.Key)).map(f => s3.getObject({ Bucket: config.s3.bucket, Key: f.Key }).createReadStream())
}

/**
 * Create a stream to write data to S3
 * @param {string} key The object key to write data to, existing data will be overwritten
 * @returns {WritableStream}
 */
export const createS3WriteStream = key => {
  const passThrough = new PassThrough()
  s3.upload({ Bucket: config.s3.bucket, Key: key, Body: passThrough }).send((err, data) => {
    if (err) {
      console.error('Failed to write to S3', err)
      passThrough.emit('error', err)
    } else {
      debug(`File successfully uploaded to S3 at ${data.Location}`)
    }
  })
  return passThrough
}
