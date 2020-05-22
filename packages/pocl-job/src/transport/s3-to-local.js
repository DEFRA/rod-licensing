import Path from 'path'
import fs from 'fs'
import stream from 'stream'
import util from 'util'
import { getTempDir, mkdirp } from '../io/file.js'
import { AWS } from '@defra-fish/connectors-lib'
const pipeline = util.promisify(stream.pipeline)
const { s3 } = AWS()

export async function s3ToLocal (s3Key) {
  const tempDir = getTempDir()
  const localPath = Path.join(Path.resolve(tempDir), s3Key)
  mkdirp(Path.dirname(localPath))
  const localWriteStream = fs.createWriteStream(localPath)
  const s3ReadStream = s3.getObject({ Bucket: process.env.POCL_S3_BUCKET, Key: s3Key }).createReadStream()
  await pipeline([s3ReadStream, localWriteStream])
  return localPath
}
