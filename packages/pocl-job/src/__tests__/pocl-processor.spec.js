import config from '../config.js'
import { execute } from '../pocl-processor.js'
import { ftpToS3 } from '../transport/ftp-to-s3.js'
import { s3ToLocal } from '../transport/s3-to-local.js'
import { getFileRecords } from '../io/db.js'
import { stage } from '../staging/pocl-data-staging.js'
import { DistributedLock } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib', () => ({
  ...jest.requireActual('@defra-fish/connectors-lib'),
  DistributedLock: jest.fn().mockReturnValue({
    obtainAndExecute: jest.fn(async ({ onLockObtained }) => {
      await onLockObtained()
    }),
    release: jest.fn()
  })
}))

jest.mock('../config.js')
jest.mock('../transport/ftp-to-s3.js')
jest.mock('../transport/s3-to-local.js')
jest.mock('../io/db.js')
jest.mock('../staging/pocl-data-staging.js')

describe('pocl-processor', () => {
  it('runs all stages to retrieve data from SFTP and stage into the Sales API', async () => {
    getFileRecords.mockResolvedValue([{ s3Key: 's3path/1' }, { s3Key: 's3path/2' }])
    s3ToLocal.mockResolvedValueOnce('local/1')
    s3ToLocal.mockResolvedValueOnce('local/2')

    await expect(execute()).resolves.toBeUndefined()
    expect(config.initialise).toHaveBeenCalled()
    expect(ftpToS3).toHaveBeenCalled()
    expect(getFileRecords).toHaveBeenCalled()
    expect(s3ToLocal).toHaveBeenNthCalledWith(1, 's3path/1')
    expect(s3ToLocal).toHaveBeenNthCalledWith(2, 's3path/2')
    expect(stage).toHaveBeenNthCalledWith(1, 'local/1')
    expect(stage).toHaveBeenNthCalledWith(2, 'local/2')
  })

  it.each(['SIGINT', 'SIGTERM'])('implements a shutdown handler to respond to the %s signal', async signal => {
    const processStopSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})
    await process.emit(signal)
    expect(processStopSpy).toHaveBeenCalledWith(0)
    expect(DistributedLock.mock.results[0].value.release).toHaveBeenCalled()
    jest.restoreAllMocks()
  })
})
