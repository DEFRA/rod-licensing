import { salesApi } from '@defra-fish/connectors-lib'
import { processRecurringPayments } from '../recurring-payments-processor.js'

// jest.mock('@defra-fish/connectors-lib')
jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: { getDueRecurringPayments: jest.fn() }
}))

describe('recurring-payments-processor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('console log displays "Recurring Payments job disabled" when env is false', async () => {
    process.env.RUN_RECURRING_PAYMENTS = 'false'
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())

    await processRecurringPayments()

    expect(consoleLogSpy).toHaveBeenCalledWith('Recurring Payments job disabled')
    consoleLogSpy.mockRestore()
  })

  it('console log displays "Recurring Payments job enabled" when env is true', async () => {
    process.env.RUN_RECURRING_PAYMENTS = 'true'
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())

    await processRecurringPayments(new Date())

    expect(consoleLogSpy).toHaveBeenCalledWith('Recurring Payments job enabled')
    consoleLogSpy.mockRestore()
  })

  it('get recurring payments is called when env is true', async () => {
    process.env.RUN_RECURRING_PAYMENTS = 'true'
    const date = new Date().toISOString().split('T')[0]

    await processRecurringPayments()

    expect(salesApi.getDueRecurringPayments).toHaveBeenCalledWith(date)
  })

  it('console log displays "Recurring Payments found: " when env is true', async () => {
    process.env.RUN_RECURRING_PAYMENTS = 'true'
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
    const rpSymbol = Symbol('rp')
    salesApi.getDueRecurringPayments.mockReturnValueOnce(rpSymbol)

    await processRecurringPayments(new Date())

    expect(consoleLogSpy).toHaveBeenCalledWith('Recurring Payments found: ', rpSymbol)
    consoleLogSpy.mockRestore()
  })
})
