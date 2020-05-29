import commander from 'commander'

jest.mock('commander', () => {
  const commander = jest.requireActual('commander')
  commander.parse = jest.fn()
  return commander
})

describe('payment-mop-up-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts the mop up job with age-minutes=3', async () => {
    jest.isolateModules(() => {
      const processor = require('../processors/processor.js')
      processor.execute = jest.fn().mockImplementation(async () => {})
      commander.parse = jest.fn(() => {
        commander.ageMinutes = 3
      })
      require('../payment-mop-up-job.js')
      expect(processor.execute).toHaveBeenCalledWith(3)
    })
  })

  it('starts the mop up job with default age of 90 minutes', async () => {
    jest.isolateModules(() => {
      const processor = require('../processors/processor.js')
      processor.execute = jest.fn().mockImplementation(async () => {})
      commander.parse = jest.fn()
      require('../payment-mop-up-job.js')
      expect(processor.execute).toHaveBeenCalledWith(90)
    })
  })

  it('will exit with an exit code of 1 with an incorrect age-minutes argument', async () => {
    jest.isolateModules(() => {
      commander.parse = jest.fn(() => {
        commander.ageMinutes = -1
      })
      const procExit = jest.spyOn(process, 'exit').mockImplementation(() => {})
      require('../payment-mop-up-job.js')
      expect(procExit).toHaveBeenCalledWith(1)
    })
  })

  it('will exit with an exit code of 1 if the mop job throws an error', async () => {
    jest.isolateModules(() => {
      const processor = require('../processors/processor.js')
      processor.execute = jest.fn().mockImplementation(async () => {
        throw new Error()
      })
      const procExit = jest.spyOn(process, 'exit').mockImplementation(() => {})
      require('../payment-mop-up-job.js')
      expect(procExit).toHaveBeenCalledWith(1)
    })
  })
})
