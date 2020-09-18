import { processFulfilment } from '../fulfilment-processor.js'
import config from '../config.js'
import { createPartFiles } from '../staging/create-part-files.js'
import { deliverFulfilmentFiles } from '../staging/deliver-fulfilment-files.js'
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

jest.mock('../config.js', () => ({
  initialise: jest.fn(async () => {})
}))
jest.mock('../staging/create-part-files.js')
jest.mock('../staging/deliver-fulfilment-files.js')

describe('fulfilment-processor', () => {
  it('processes fulfilment', async () => {
    await expect(processFulfilment()).resolves.toBeUndefined()
    expect(config.initialise).toHaveBeenCalled()
    expect(createPartFiles).toHaveBeenCalled()
    expect(deliverFulfilmentFiles).toHaveBeenCalled()
  })

  it.each(['SIGINT', 'SIGTERM'])('implements a shutdown handler to respond to the %s signal', async signal => {
    const processStopSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})
    await process.emit(signal)
    expect(processStopSpy).toHaveBeenCalledWith(0)
    expect(DistributedLock.mock.results[0].value.release).toHaveBeenCalled()
    jest.restoreAllMocks()
  })
})
