import { promisify } from 'util'
import { Readable, pipeline } from 'stream'
import { createHash } from 'crypto'
import merge2 from 'merge2'
import moment from 'moment'
import { executeQuery, persist, findFulfilmentFiles } from '@defra-fish/dynamics-lib'
import { createS3WriteStream, readS3PartFiles } from '../transport/s3.js'
import { createFtpWriteStream } from '../transport/ftp.js'
import { FULFILMENT_FILE_STATUS_OPTIONSET, getOptionSetEntry } from './staging-common.js'
import db from 'debug'
const debug = db('fulfilment:staging')
const pipelinePromise = promisify(pipeline)

/**
 *
 * @returns {Promise<void>}
 */
export const deliverFulfilmentFiles = async () => {
  debug('Aggregating fulfilment part files')
  const results = await executeQuery(findFulfilmentFiles({ status: await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Exported') }))
  for (const { entity: file } of results) {
    const pfStreams = await readS3PartFiles(file)
    // Each part file stream must be separated with a comma, insert a new readable stream yielding a comma between each part file stream
    const mergeStreams = pfStreams.flatMap((pfs, idx, arr) => (idx !== arr.length - 1 ? [pfs, Readable.from([',\n'])] : pfs))
    await pipelinePromise([
      // Pipeline for the fulfilment data
      merge2(Readable.from(['{\n  "licences": [\n']), ...mergeStreams, Readable.from(['\n  ]\n}\n'])),
      createS3WriteStream(file.fileName),
      await createFtpWriteStream(file.fileName),
      // Pipeline for the sha256 hash
      createHash('sha256').setEncoding('hex'),
      createS3WriteStream(`${file.fileName}.sha256`),
      await createFtpWriteStream(`${file.fileName}.sha256`)
    ])

    file.deliveryTimestamp = moment().toISOString()
    file.status = await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Delivered')
    file.notes = `The fulfilment file was successfully delivered at ${file.deliveryTimestamp}`
    await persist(file)
  }
}
