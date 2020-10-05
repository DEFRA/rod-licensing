import * as processor from '../processors/processor.js'
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
jest.mock('../processors/processor.js')

describe('payment-mop-up-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts the mop up job with --age-minutes=3 and --scan-duration=67', () => {
    jest.isolateModules(() => {
      processor.execute.mockResolvedValue(undefined)
      process.env.INCOMPLETE_PURCHASE_AGE_MINUTES = 3
      process.env.SCAN_DURATION_HOURS = 67
      require('../payment-mop-up-job.js')
      expect(processor.execute).toHaveBeenCalledWith(3, 67)
    })
  })

  it('starts the mop up job with default age of 180 minutes and scan duration of 24 hours', () => {
    jest.isolateModules(() => {
      processor.execute.mockResolvedValue(undefined)
      delete process.env.INCOMPLETE_PURCHASE_AGE_MINUTES
      delete process.env.SCAN_DURATION_HOURS
      require('../payment-mop-up-job.js')
      expect(processor.execute).toHaveBeenCalledWith(180, 24)
    })
  })

  it('will exit if the mop up job throws an error', done => {
    jest.isolateModules(() => {
      try {
        const testError = new Error('Test Error')
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
        processor.execute.mockRejectedValue(testError)
        require('../payment-mop-up-job.js')
        process.nextTick(() => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(testError)
          done()
        })
      } catch (e) {
        done(e)
      }
    })
  })

  describe.each(['SIGINT', 'SIGTERM'])('implements a shutdown handler to respond to the %s signal', signal => {
    it('which releases the lock', done => {
      jest.isolateModules(() => {
        processor.execute.mockResolvedValue(undefined)
        require('../payment-mop-up-job.js')
        const processStopSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
        process.emit(signal)
        process.nextTick(() => {
          try {
            expect(processStopSpy).toHaveBeenCalledWith(0)
            expect(DistributedLock.mock.results[0].value.release).toHaveBeenCalled()
            jest.restoreAllMocks()
            done()
          } catch (e) {
            done(e)
          }
        })
      })
    })
  })
})
