import commander from 'commander'
import { execute } from '../recurring-payments-processor.js'
import fs from 'fs'

jest.useFakeTimers()
jest.mock('../recurring-payments-processor.js')
/*
without the following mock, the tests fail on the fs mock, with an error in connectors-lib
even though connectors-lib isn't used in recurring-payments-job.js anymore. Not got time to
work out why this is at the moment...
*/
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

  it('calls execute when no delay', () => {
    jest.isolateModules(() => {
      process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '0'
      require('../recurring-payments-job.js')
      expect(execute).toHaveBeenCalled()
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

  it('calls execute when delay', () => {
    process.env.RECURRING_PAYMENTS_LOCAL_DELAY = '5'
    jest.isolateModules(() => {
      require('../recurring-payments-job.js')
      jest.advanceTimersByTime(parseInt(process.env.RECURRING_PAYMENTS_LOCAL_DELAY) * 1000)
      expect(execute).toHaveBeenCalled()
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
