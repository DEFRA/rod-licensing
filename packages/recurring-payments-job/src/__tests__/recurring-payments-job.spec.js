import recurringPaymentsJob from '../recurring-payments-job.js'
import { processRecurringPayments } from '../recurring-payments-processor.js'

jest.mock('../recurring-payments-processor.js', () => ({
  processRecurringPayments: jest.fn()
}))

jest.mock('commander', () => {
  return {
    Command: jest.fn(() => ({
      action: jest.fn(),
      command: jest.fn().mockReturnThis(),
      parse: jest.fn()
    }))
  }
})

describe('recurring-payments-job', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should set up rpJob command with action to process recurring payments', () => {
    recurringPaymentsJob()

    expect(processRecurringPayments).toHaveBeenCalled()
  })

  it('should not call setTimeout if no delay', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

    recurringPaymentsJob()

    expect(setTimeoutSpy).not.toBeCalled()
  })

  it('should call setTimeout with the correct delay', () => {
    process.env.RECURRING_PAYMENTS_LOCAL_DELAY = 5
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

    recurringPaymentsJob()

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), parseInt(process.env.RECURRING_PAYMENTS_LOCAL_DELAY, 10) * 1000)
  })
})
