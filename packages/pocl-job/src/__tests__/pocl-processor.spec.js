import { execute } from '../pocl-processor.js'
import { ftpToS3 } from '../transport/ftp-to-s3.js'
import { s3ToLocal } from '../transport/s3-to-local.js'
import { getFileRecords } from '../io/db.js'
import { stage } from '../staging/pocl-data-staging.js'

jest.mock('fs')
jest.mock('../transport/ftp-to-s3.js')
jest.mock('../transport/s3-to-local.js')
jest.mock('../io/db.js')
jest.mock('../staging/pocl-data-staging.js')

describe('pocl-processor', () => {
  it('runs all stages to retrieve data from SFTP and stage into the Sales API', async () => {
    getFileRecords.mockResolvedValue([{ s3Key: 's3path/1' }, { s3Key: 's3path/2' }])
    s3ToLocal.mockResolvedValueOnce('local/1')
    s3ToLocal.mockResolvedValueOnce('local/2')

    await execute()
    expect(ftpToS3).toHaveBeenCalled()
    expect(getFileRecords).toHaveBeenCalled()
    expect(s3ToLocal).toHaveBeenNthCalledWith(1, 's3path/1')
    expect(s3ToLocal).toHaveBeenNthCalledWith(2, 's3path/2')
    expect(stage).toHaveBeenNthCalledWith(1, 'local/1')
    expect(stage).toHaveBeenNthCalledWith(2, 'local/2')
  })
})
