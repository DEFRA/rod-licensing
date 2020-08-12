import * as processor from '../processors/processor.js'

jest.mock('../processors/processor.js')

describe('payment-mop-up-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts the mop up job with --age-minutes=3 and --scan-duration=67', async () => {
    jest.isolateModules(async () => {
      processor.execute = jest.fn(async () => Promise.resolve())
      await (async () => {
        process.env.INCOMPLETE_PURCHASE_AGE_MINUTES = 3
        process.env.SCAN_DURATION_HOURS = 67
        require('../payment-mop-up-job.js')
      })()
      expect(processor.execute).toHaveBeenCalledWith(3, 67)
    })
  })

  it('starts the mop up job with default age of 180 minutes and scan duration of 24 hours', async () => {
    jest.isolateModules(async () => {
      processor.execute = jest.fn(async () => Promise.resolve())
      await (async () => {
        delete process.env.INCOMPLETE_PURCHASE_AGE_MINUTES
        delete process.env.SCAN_DURATION_HOURS
        require('../payment-mop-up-job.js')
      })()
      expect(processor.execute).toHaveBeenCalledWith(180, 24)
    })
  })

  it('will exit if the mop up job throws an error', async () => {
    jest.isolateModules(async () => {
      processor.execute = jest.fn().mockImplementationOnce(async () => {
        throw new Error()
      })
      await (async () => {
        require('../payment-mop-up-job.js')
      })()
    })
  })
})
