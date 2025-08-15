import commander from 'commander'
import { processRecurringPayments } from '../recurring-payments-processor.js'
import fs from 'fs'

jest.useFakeTimers()

jest.mock('../recurring-payments-processor.js', () => {
  if (!global.processRecurringPayments) {
    global.processRecurringPayments = jest.fn()
  }
  return { processRecurringPayments: global.processRecurringPayments }
})

jest.mock('commander', () => {
  if (!global.commander) {
    global.commander = jest.requireActual('commander')
  }
  return global.commander
})

jest.mock('fs')

describe('recurring-payments-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    commander.args = ['test']
  })

  it('logs startup details including name and version', () => {
    const mockPkg = { name: 'recurring-payments-test', version: '1.2.3' }
    fs.readFileSync.mockReturnValue(JSON.stringify(mockPkg))

    jest.isolateModules(() => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      require('../recurring-payments-job.js')
      expect(logSpy).toHaveBeenCalledWith(
        'Recurring payments job starting at %s. name: %s. version: %s',
        expect.any(String),
        mockPkg.name,
        mockPkg.version
      )
    })
  })

  it('calls processRecurringPayments when no delay', () => {
    jest.isolateModules(() => {
      require('../recurring-payments-job.js')
      expect(processRecurringPayments).toHaveBeenCalled()
    })
  })

  it('doesnt call setTimeout when no correct delay', () => {
    jest.isolateModules(() => {
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
