import commander from 'commander'
import { airbrake } from '@defra-fish/connectors-lib'
import { processRecurringPayments } from '../recurring-payments-processor.js'
import fs from 'fs'

jest.useFakeTimers()

jest.mock('../recurring-payments-processor.js')
jest.mock('@defra-fish/connectors-lib', () => ({
  airbrake: {
    initialise: jest.fn(),
    flush: jest.fn()
  }
}))

jest.mock('fs')
describe('recurring-payments-job', () => {
  beforeAll(() => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ name: 'recurring-payments-test', version: '1.0.0' }))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    commander.args = ['test']
  })

  it('initialises airbrake', () => {
    jest.isolateModules(() => {
      require('../recurring-payments-job.js')
      expect(airbrake.initialise).toHaveBeenCalled()
    })
  })

  it('flushes airbrake before script ends', () => {
    jest.isolateModules(() => {
      require('../recurring-payments-job.js')
      expect(airbrake.flush).toHaveBeenCalled()
    })
  })

  it("doesn't flush airbrake before processRecurringPayments has been called", () => {
    jest.isolateModules(() => {
      processRecurringPayments.mockImplementationOnce(() => {
        expect(airbrake.flush).not.toHaveBeenCalled()
      })
      require('../recurring-payments-job.js')
    })
  })

  it.each([
    ['SIGINT', 130],
    ['SIGTERM', 137]
  ])('flushes airbrake on %s signal', (signal, code) => {
    jest.isolateModules(() => {
      // setup a delay so script doesn't call processRecurringPayments and exit naturally
      process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '1'
      const signalCallbacks = {}
      jest.spyOn(process, 'on')
      jest.spyOn(process, 'exit')
      process.on.mockImplementation((signalToken, callback) => {
        signalCallbacks[signalToken] = callback
      })
      process.exit.mockImplementation(() => {
        // so we don't crash out of the tests!
      })

      require('../recurring-payments-job.js')
      signalCallbacks[signal]()

      expect(airbrake.flush).toHaveBeenCalled()
      process.on.mockRestore()
      process.exit.mockRestore()
    })
  })

  it.each([
    ['SIGINT', 130],
    ['SIGTERM', 137]
  ])('calls process.exit on %s signal with %i code', (signal, code) => {
    jest.isolateModules(() => {
      // setup a delay so script doesn't call processRecurringPayments and exit naturally
      process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '1'
      const signalCallbacks = {}
      jest.spyOn(process, 'on')
      jest.spyOn(process, 'exit')
      process.on.mockImplementation((signalToken, callback) => {
        signalCallbacks[signalToken] = callback
      })
      process.exit.mockImplementation(() => {
        // so we don't crash out of the tests!
      })

      require('../recurring-payments-job.js')
      signalCallbacks[signal]()

      expect(process.exit).toHaveBeenCalledWith(code)
      process.on.mockRestore()
      process.exit.mockRestore()
    })
  })

  it('logs startup details including name and version', () => {
    const mockPkg = { name: 'recurring-payments-test', version: '1.2.3' }
    fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPkg))

    jest.isolateModules(() => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      require('../recurring-payments-job.js')
      expect(logSpy).toHaveBeenCalledWith(
        'Recurring payments job starting at %s. name: %s. version: %s',
        expect.any(String),
        mockPkg.name,
        mockPkg.version
      )
      logSpy.mockRestore()
    })
  })

  it('calls processRecurringPayments when no delay', () => {
    jest.isolateModules(() => {
      process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '0'
      require('../recurring-payments-job.js')
      expect(processRecurringPayments).toHaveBeenCalled()
    })
  })

  it('doesnt call setTimeout when no correct delay', () => {
    jest.isolateModules(() => {
      process.env.RECURRING_PAYMENTS_LOCAL_DELAY = 'invalid-delay'
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      require('../recurring-payments-job.js')
      expect(setTimeoutSpy).not.toHaveBeenCalled()
    })
  })

  it('calls processRecurringPayments when delay', () => {
    process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '5'
    jest.isolateModules(() => {
      require('../recurring-payments-job.js')
      jest.advanceTimersByTime(parseInt(process.env.RECURRING_PAYMENTS_LOCAL_DELAY) * 1000)
      expect(processRecurringPayments).toHaveBeenCalled()
    })
  })

  it('calls setTimeout with the correct delay', () => {
    process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '5'
    jest.isolateModules(() => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      require('../recurring-payments-job.js')
      expect(setTimeoutSpy).toHaveBeenCalled()
    })
  })
})
