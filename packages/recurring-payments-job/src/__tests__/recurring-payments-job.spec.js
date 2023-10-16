import rpJob from '../recurring-payments-job.js'
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
    rpJob.action()
    expect(processRecurringPayments).toHaveBeenCalled()
  })
})
