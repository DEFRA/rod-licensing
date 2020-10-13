import * as processor from '../processors/processor.js'

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
jest.mock('../processors/processor.js')

describe('payment-mop-up-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.simulateLockError = false
    global.lockReleased = false
  })

  it('starts the mop up job with --age-minutes=3 and --scan-duration=67', done => {
    jest.isolateModules(() => {
      processor.execute.mockResolvedValue(undefined)
      process.env.INCOMPLETE_PURCHASE_AGE_MINUTES = 3
      process.env.SCAN_DURATION_HOURS = 67
      require('../payment-mop-up-job.js')
      process.nextTick(() => {
        expect(processor.execute).toHaveBeenCalledWith(3, 67)
        expect(global.lockReleased).toEqual(true)
        done()
      })
    })
  })

  it('starts the mop up job with default age of 60 minutes and scan duration of 24 hours', done => {
    jest.isolateModules(() => {
      processor.execute.mockResolvedValue(undefined)
      delete process.env.INCOMPLETE_PURCHASE_AGE_MINUTES
      delete process.env.SCAN_DURATION_HOURS
      require('../payment-mop-up-job.js')
      process.nextTick(() => {
        expect(processor.execute).toHaveBeenCalledWith(60, 24)
        expect(global.lockReleased).toEqual(true)
        done()
      })
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
          expect(global.lockReleased).toEqual(true)
          done()
        })
      } catch (e) {
        done(e)
      }
    })
  })

  it('outputs a warning and exits with code 0 if the lock cannot be obtained', done => {
    jest.isolateModules(() => {
      global.simulateLockError = true
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
      require('../payment-mop-up-job.js')
      expect(processor.execute).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Unable to obtain a lock for the payment mop-up job, skipping execution.',
        expect.any(Error)
      )
      expect(processExitSpy).toHaveBeenCalledWith(0)
      done()
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
            expect(global.lockReleased).toEqual(true)
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
