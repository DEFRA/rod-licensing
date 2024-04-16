import commander from 'commander'
import { processRecurringPayments } from '../recurring-payments-processor.js'

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

describe('recurring-payments-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    commander.args = ['test']
  })

  it('calls processRecurringPayments', () => {
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

  it('calls setTimeout with the correct delay', () => {
    process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '5'
    jest.isolateModules(() => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      require('../recurring-payments-job.js')
      expect(setTimeoutSpy).toHaveBeenCalled()
    })
  })
})
