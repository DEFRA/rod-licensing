import Path from 'path'
import fs from 'fs'
import stream from 'stream'
import util from 'util'
import { getTempDir } from '../io/file.js'
import { AWS } from '@defra-fish/connectors-lib'
const pipeline = util.promisify(stream.pipeline)
const { s3 } = AWS()

export async function s3ToLocal (s3Key) {
  const localPath = Path.join(getTempDir(Path.dirname(s3Key)), Path.basename(s3Key))
  const localWriteStream = fs.createWriteStream(localPath)
  const s3ReadStream = s3.getObject({ Bucket: process.env.POCL_S3_BUCKET, Key: s3Key }).createReadStream()
  await pipeline([s3ReadStream, localWriteStream])
  return localPath
}
