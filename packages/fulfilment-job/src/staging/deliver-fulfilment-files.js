import { Readable } from 'stream'
import merge2 from 'merge2'
import moment from 'moment'
import { executeQuery, persist, findFulfilmentFiles } from '@defra-fish/dynamics-lib'
import { createS3WriteStream, readS3PartFiles } from '../transport/s3.js'
import { createFtpWriteStream } from '../transport/ftp.js'
import { FULFILMENT_FILE_STATUS_OPTIONSET, getOptionSetEntry } from './staging-common.js'
import db from 'debug'
import openpgp from 'openpgp'
import config from '../config.js'
import streamHelper from './streamHelper.js'

const debug = db('fulfilment:staging')

/**
 * Deliver any fulfilment files previously staged in S3 and recorded in Dynamics with the 'Exported' status
 *
 * @returns {Promise<void>}
 */
export const deliverFulfilmentFiles = async () => {
  debug('Aggregating fulfilment part files')
  const results = await executeQuery(findFulfilmentFiles({ status: await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Exported') }))
  results.sort((a, b) => a.entity.fileName.localeCompare(b.entity.fileName))
  for (const { entity: file } of results) {
    if (config.pgp.sendUnencryptedFile) {
      await deliver(file.fileName, await createDataReadStream(file))
    }
    const encryptedDataReadStream = await createEncryptedDataReadStream(file)
    debug('Retrieved encrypted data stream, delivering encrypted data file')
    await deliver(`${file.fileName}.enc`, encryptedDataReadStream)
    // await deliver(`${file.fileName}.enc`, await createEncryptedDataReadStream(file))
    debug('delivery complete, upating delivery timestamp')
    file.deliveryTimestamp = moment().toISOString()
    debug('delivery timestamp updated, updating file status')
    file.status = await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Delivered')
    debug('file status updated, updating file notes')
    file.notes = `The fulfilment file was successfully delivered at ${file.deliveryTimestamp}`
    debug('file notes updated, persisting file object back to CRM')
    await persist([file])
    debug('file object persisted in CRM, all finished!')
  }
}

/**
 * Create a stream to read the content of all part files from S3 and transform to the output file format
 *
 * @param {FulfilmentRequestFile} file The fulfilment request file being processed
 * @returns {Promise<ReadableStream>}
 */
const createDataReadStream = async file => {
  const pfStreams = await readS3PartFiles(file)
  // Each part file stream must be separated with a comma, insert a new readable stream yielding a comma between each part file stream
  const mergeStreams = pfStreams.flatMap((pfs, idx, arr) => (idx !== arr.length - 1 ? [pfs, Readable.from([',\n'])] : pfs))
  return merge2(Readable.from(['{\n  "licences": [\n']), ...mergeStreams, Readable.from(['\n  ]\n}\n']))
}

const createEncryptedDataReadStream = async file => {
  const readableStream = await createDataReadStream(file)
  const encryptionKeys = await openpgp.readKey({
    armoredKey: config.pgp.publicKey
  })
  debug('Encryption keys read, creating message stream')
  const message = await openpgp.createMessage({ text: readableStream })
  debug('Message stream created, encrypting...')
  return openpgp.encrypt({
    message,
    encryptionKeys
  })
  // return openpgp.encrypt({
  //   message: await openpgp.createMessage({ text: readableStream }),
  //   encryptionKeys
  // })
}

/**
 * Deliver the data provided in the readable stream to S3 and FTP under the given targetFileName, optionally applying any supplied transforms
 *
 * @param {string} targetFileName the name of the file to be delivered
 * @param {ReadableStream} readableStream the stream providing the content to be delivered
 * @param {...TransformStream|module:crypto.Hash} [transforms] Optional transform streams to apply
 * @returns {Promise<void>}
 */
const deliver = async (targetFileName, readableStream, ...transforms) => {
  const { s3WriteStream: s3DataStream, managedUpload: s3DataManagedUpload } = createS3WriteStream(targetFileName)
  const { ftpWriteStream: ftpDataStream, managedUpload: ftpDataManagedUpload } = createFtpWriteStream(targetFileName)

  debug('awaiting stream helper pipeline promise')
  await streamHelper.pipelinePromise([readableStream, ...transforms, s3DataStream, ftpDataStream])
  debug('stream helper pipeline promise complete, awaiting s3 managed upload')
  await s3DataManagedUpload
  debug('s3 managed upload complete, awaiting ftp managed upload')
  await ftpDataManagedUpload
  debug('ftp managed upload complete')
  // await Promise.all([
  //   streamHelper.pipelinePromise([readableStream, ...transforms, s3DataStream, ftpDataStream]),
  //   s3DataManagedUpload,
  //   ftpDataManagedUpload
  // ])
}
