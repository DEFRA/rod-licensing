import { processFulfilment } from '../fulfilment-processor.js'
import config from '../config.js'
import { createPartFiles } from '../staging/create-part-files.js'
import { deliverFulfilmentFiles } from '../staging/deliver-fulfilment-files.js'

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

jest.mock('../config.js', () => ({
  initialise: jest.fn(async () => {})
}))
jest.mock('../staging/create-part-files.js')
jest.mock('../staging/deliver-fulfilment-files.js')

describe('fulfilment-processor', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    global.simulateLockError = false
    global.lockReleased = false
  })

  it('processes fulfilment', async () => {
    await expect(processFulfilment()).resolves.toBeUndefined()
    expect(config.initialise).toHaveBeenCalled()
    expect(createPartFiles).toHaveBeenCalled()
    expect(deliverFulfilmentFiles).toHaveBeenCalled()
    expect(global.lockReleased).toEqual(true)
  })

  it('outputs a warning and exits with code 0 if the lock cannot be obtained', async () => {
    global.simulateLockError = true
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
    await expect(processFulfilment()).resolves.toBeUndefined()
    expect(config.initialise).not.toHaveBeenCalled()
    expect(consoleLogSpy).toHaveBeenCalledWith('Unable to obtain a lock for the fulfilment job, skipping execution.', expect.any(Error))
    expect(processExitSpy).toHaveBeenCalledWith(0)
  })

  it.each(['SIGINT', 'SIGTERM'])('implements a shutdown handler to respond to the %s signal', async signal => {
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
    await process.emit(signal)
    expect(processExitSpy).toHaveBeenCalledWith(0)
    expect(global.lockReleased).toEqual(true)
    jest.restoreAllMocks()
  })
})
