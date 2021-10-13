import { execute } from '../pocl-processor.js'
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
jest.mock('fs')
jest.mock('../transform/pocl-transform-stream.js')
jest.mock('../staging/pocl-data-staging.js')
jest.mock('../pocl-processor.js', () => {
  if (!global.poclProcessor) {
    global.poclProcessor = jest.fn()
  }
  return { execute: global.poclProcessor }
})

describe('pocl-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('exposes an execute command to the cli', async () => {
    jest.isolateModules(() => {
      require('../pocl-job.js')
      expect(commander.commands[0].name()).toBe('execute')
      commander.commands[0]._actionHandler([])
      expect(execute).toHaveBeenCalled()
    })
  })

  it('uses a wildcard match to output help when command not found', async () => {
    jest.isolateModules(() => {
      require('../pocl-job.js')
      expect(commander.commands[1].name()).toBe('*')
      commander.commands[1]._actionHandler(['testxmlfile.xml'])
      expect(commander.help).toHaveBeenCalled()
    })
  })

  it('outputs help if no arguments are present', async () => {
    jest.isolateModules(() => {
      commander.args = []
      require('../pocl-job.js')
      expect(commander.outputHelp).toHaveBeenCalled()
    })
  })
})
