import { execute } from '../recurring-payments-processor.js'
import commander from 'commander'

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

jest.mock('../recurring-payments-processor.js', () => {
  if (!global.rpProcessor) {
    global.rpProcessor = jest.fn()
  }
  return { execute: global.rpProcessor }
})

describe('recurring-payments-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('exposes an execute command to the cli', async () => {
    jest.isolateModules(() => {
      require('../recurring-payments-job.js')
      expect(commander.commands[0].name()).toBe('execute')
      commander.commands[0]._actionHandler([])
      expect(execute).toHaveBeenCalled()
    })
  })

  it('uses a wildcard match to output help when command not found', async () => {
    jest.isolateModules(() => {
      require('../recurring-payments-job.js')
      expect(commander.commands[1].name()).toBe('*')
      commander.commands[1]._actionHandler(['testxmlfile.xml'])
      expect(commander.help).toHaveBeenCalled()
    })
  })

  it('outputs help if no arguments are present', async () => {
    jest.isolateModules(() => {
      commander.args = []
      require('../recurring-payments-job.js')
      expect(commander.outputHelp).toHaveBeenCalled()
    })
  })
})
