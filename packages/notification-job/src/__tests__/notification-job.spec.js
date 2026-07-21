import commander from 'commander'
import { execute } from '../notification-processor.js'
import fs from 'fs'

jest.useFakeTimers()
jest.mock('../notification-processor.js')
jest.mock('@defra-fish/connectors-lib', () => ({
  airbrake: { initialise: jest.fn(), flush: jest.fn() },
  salesApi: {},
  govUkNotifyApi: {},
  DistributedLock: jest.fn(() => ({ obtainAndExecute: jest.fn(), release: jest.fn() }))
}))
jest.mock('notifications-node-client', () => ({
  NotifyClient: jest.fn()
}))
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  promises: {
    readFile: jest.fn()
  }
}))

describe('notification-job', () => {
  beforeAll(() => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ name: 'notification-job-test', version: '1.0.0' }))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    commander.args = ['test']
  })

  it('logs startup details including name and version', () => {
    const mockPkg = { name: 'notification-job-test', version: '1.2.3' }
    fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPkg))

    jest.isolateModules(() => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      require('../notification-job.js')
      expect(logSpy).toHaveBeenCalledWith(
        'Notification job starting at %s. name: %s. version: %s',
        expect.any(String),
        mockPkg.name,
        mockPkg.version
      )
      logSpy.mockRestore()
    })
  })

  it('calls execute when no delay', () => {
    jest.isolateModules(() => {
      process.env.NOTIFICATION_JOB_LOCAL_DELAY = '0'
      require('../notification-job.js')
      expect(execute).toHaveBeenCalled()
    })
  })

  it('does not call setTimeout when delay is invalid', () => {
    jest.isolateModules(() => {
      process.env.NOTIFICATION_JOB_LOCAL_DELAY = 'invalid-delay'
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      require('../notification-job.js')
      expect(setTimeoutSpy).not.toHaveBeenCalled()
    })
  })

  it('calls execute after delay', () => {
    process.env.NOTIFICATION_JOB_LOCAL_DELAY = '5'
    jest.isolateModules(() => {
      require('../notification-job.js')
      jest.advanceTimersByTime(parseInt(process.env.NOTIFICATION_JOB_LOCAL_DELAY) * 1000)
      expect(execute).toHaveBeenCalled()
    })
  })

  it('calls setTimeout with the correct delay', () => {
    process.env.NOTIFICATION_JOB_LOCAL_DELAY = '5'
    jest.isolateModules(() => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      require('../notification-job.js')
      expect(setTimeoutSpy).toHaveBeenCalled()
    })
  })
})
