import commander from 'commander'
import { airbrake } from '@defra-fish/connectors-lib'
import { processRecurringPayments } from '../recurring-payments-processor.js'

jest.useFakeTimers()

jest.mock('../recurring-payments-processor.js')
jest.mock('@defra-fish/connectors-lib', () => ({
  airbrake: {
    initialise: jest.fn(),
    flush: jest.fn()
  }
}))

describe('recurring-payments-job', () => {
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
