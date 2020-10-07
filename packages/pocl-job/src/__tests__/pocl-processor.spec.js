import config from '../config.js'
import { execute } from '../pocl-processor.js'
import { ftpToS3 } from '../transport/ftp-to-s3.js'
import { s3ToLocal } from '../transport/s3-to-local.js'
import { getFileRecords } from '../io/db.js'
import { stage } from '../staging/pocl-data-staging.js'

global.simulateLockError = false
global.lockReleased = false
jest.mock('@defra-fish/connectors-lib', () => ({
  ...jest.requireActual('@defra-fish/connectors-lib'),
  DistributedLock: jest.fn().mockReturnValue({
    obtainAndExecute: jest.fn(async ({ onLockObtained, onLockError }) => {
      if (global.simulateLockError) {
        await onLockError(new Error('Test error'))
      } else {
        try {
          await onLockObtained()
        } finally {
          global.lockReleased = true
        }
      }
    }),
    release: jest.fn(async () => {
      global.lockReleased = true
    })
  })
}))

jest.mock('../config.js')
jest.mock('../transport/ftp-to-s3.js')
jest.mock('../transport/s3-to-local.js')
jest.mock('../io/db.js')
jest.mock('../staging/pocl-data-staging.js')

describe('pocl-processor', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    global.simulateLockError = false
    global.lockReleased = false
  })

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
    expect(global.lockReleased).toEqual(true)
  })

  it('outputs a warning and exits with code 0 if the lock cannot be obtained', async () => {
    global.simulateLockError = true
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
    await expect(execute()).resolves.toBeUndefined()
    expect(config.initialise).not.toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith('Unable to obtain a lock for the pocl job, skipping execution.', expect.any(Error))
    expect(processExitSpy).toHaveBeenCalledWith(0)
  })

  it.each(['SIGINT', 'SIGTERM'])('implements a shutdown handler to respond to the %s signal', async signal => {
    const processStopSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})
    await process.emit(signal)
    expect(processStopSpy).toHaveBeenCalledWith(0)
    expect(global.lockReleased).toEqual(true)
    jest.restoreAllMocks()
  })
})
