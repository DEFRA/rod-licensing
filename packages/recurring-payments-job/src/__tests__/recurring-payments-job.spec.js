import recurringPaymentsJob from '../recurring-payments-job.js'

it('console log outputs recurring payments job is running', async () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
  recurringPaymentsJob()
  expect(consoleLogSpy).toHaveBeenCalledWith('rp job running')
})
