import { Transaction } from './bindings/pocl/transaction/transaction.bindings.js'
import SaxStream from 'sax-stream'
import through2 from 'through2'
import stream from 'stream'
import util from 'util'
import fs from 'fs'
const pipeline = util.promisify(stream.pipeline)

/**
 * Transform POCL XML into a JSON structure suitable for submitting to the Sales API.
 *
 * @param {string} xmlFilePath The path of the XML file to read from
 * @param {WritableStream} writableStream The writeable stream to consume the JSON data
 * @returns {Promise<void>}
 */
export const transform = async (xmlFilePath, ...writableStream) => {
  await pipeline([
    fs.createReadStream(xmlFilePath),
    SaxStream({ highWaterMark: 25, strict: true, trim: true, normalize: true, xmlns: false, tag: Transaction.element }),
    through2.obj(async function (data, enc, cb) {
      try {
        cb(null, await Transaction.transform(data))
      } catch (e) {
        console.error('Error processing POCL transaction', e, data)
        cb(e)
      }
    }),
    ...writableStream
  ])
}
