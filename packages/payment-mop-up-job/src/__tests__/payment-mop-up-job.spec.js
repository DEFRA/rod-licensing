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

describe('payment-mop-up-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.simulateLockError = false
    global.lockReleased = false
  })

  it('logs startup details including name and version', () => {
    process.env.name = 'payment-mop-up-test'
    process.env.version = '1.2.3'

    jest.isolateModules(() => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      require('../payment-mop-up-job.js')
      expect(logSpy).toHaveBeenCalledWith(
        'Payment mop up job starting at %s. name: %s. version: %s',
        expect.any(String),
        process.env.name,
        process.env.version
      )
    })
  })

  it('starts the mop up job with --age-minutes=3 and --scan-duration=67', done => {
    jest.isolateModules(() => {
      const mockExecute = jest.fn()
      jest.doMock('../processors/processor.js', () => ({
        execute: mockExecute
      }))
      process.env.INCOMPLETE_PURCHASE_AGE_MINUTES = 3
      process.env.SCAN_DURATION_HOURS = 67
      require('../payment-mop-up-job.js')
      process.nextTick(() => {
        expect(mockExecute).toHaveBeenCalledWith(3, 67)
        expect(global.lockReleased).toEqual(true)
        done()
      })
    })
  })

  it('starts the mop up job with default age of 60 minutes and scan duration of 24 hours', done => {
    jest.isolateModules(() => {
      const mockExecute = jest.fn()
      jest.doMock('../processors/processor.js', () => ({
        execute: mockExecute
      }))
      delete process.env.INCOMPLETE_PURCHASE_AGE_MINUTES
      delete process.env.SCAN_DURATION_HOURS
      require('../payment-mop-up-job.js')
      process.nextTick(() => {
        expect(mockExecute).toHaveBeenCalledWith(60, 24)
        expect(global.lockReleased).toEqual(true)
        done()
      })
    })
  })

  it('will exit if the mop up job throws an error', done => {
    jest.isolateModules(() => {
      const mockExecute = jest.fn()
      jest.doMock('../processors/processor.js', () => ({
        execute: mockExecute
      }))
      try {
        const testError = new Error('Test Error')
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
        mockExecute.mockRejectedValue(testError)
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
      const mockExecute = jest.fn()
      jest.doMock('../processors/processor.js', () => ({
        execute: mockExecute
      }))
      global.simulateLockError = true
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
      require('../payment-mop-up-job.js')
      expect(mockExecute).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Unable to obtain a lock for the payment mop-up job, skipping execution.',
        expect.any(Error)
      )
      expect(processExitSpy).toHaveBeenCalledWith(0)
      done()
    })
  })

  describe.each([
    ['SIGINT', 130],
    ['SIGTERM', 137]
  ])('implements a shutdown handler to respond to the %s signal', (signal, code) => {
    it(`exits the process with code ${code}`, done => {
      jest.isolateModules(() => {
        const mockExecute = jest.fn()
        jest.doMock('../processors/processor.js', () => ({
          execute: mockExecute
        }))
        mockExecute.mockResolvedValue(undefined)
        require('../payment-mop-up-job.js')
        const processStopSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
        process.emit(signal)
        process.nextTick(() => {
          try {
            expect(processStopSpy).toHaveBeenCalledWith(code)
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
