import fs from 'fs'
export default {
  file: {
    size: Number.parseInt(process.env.FULFILMENT_FILE_SIZE)
  },
  ftp: {
    host: process.env.FULFILMENT_FTP_HOST,
    port: process.env.FULFILMENT_FTP_PORT || 22,
    path: process.env.FULFILMENT_FTP_PATH,
    username: process.env.FULFILMENT_FTP_USERNAME,
    privateKey: fs.readFileSync(process.env.FULFILMENT_FTP_PRIVATE_KEY_PATH)
  },
  s3: {
    bucket: process.env.FULFILMENT_S3_BUCKET
  }
}
