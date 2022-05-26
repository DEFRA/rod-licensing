import commander from 'commander'
import { processFulfilment } from '../fulfilment-processor.js'

jest.mock('../fulfilment-processor.js', () => {
  if (!global.processFulfilment) {
    global.processFulfilment = jest.fn()
  }
  return { processFulfilment: global.processFulfilment }
})

jest.mock('commander', () => {
  if (!global.commander) {
    global.commander = jest.requireActual('commander')
    global.commander.args = ['test']
    global.commander.parse = jest.fn()
    global.commander.outputHelp = jest.fn()
    global.commander.help = jest.fn()
  }
  return global.commander
})
describe('fulfilment-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    commander.args = ['test']
  })

  it('exposes an execute command to the cli', () => {
    jest.isolateModules(() => {
      require('../fulfilment-job.js')
      expect(commander.commands[0].name()).toBe('execute')
      commander.commands[0]._actionHandler([])
      expect(processFulfilment).toHaveBeenCalled()
    })
  })

  it('uses a wildcard match to output help when command not found', async () => {
    jest.isolateModules(() => {
      require('../fulfilment-job.js')
      expect(commander.commands[1].name()).toBe('*')
      commander.commands[1]._actionHandler([])
      expect(commander.help).toHaveBeenCalled()
    })
  })

  it('outputs help if no arguments are present', async () => {
    jest.isolateModules(() => {
      commander.args.length = 0
      require('../fulfilment-job.js')
      expect(commander.outputHelp).toHaveBeenCalled()
    })
  })
})
