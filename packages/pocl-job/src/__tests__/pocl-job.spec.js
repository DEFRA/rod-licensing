import { execute } from '../pocl-processor.js'
import commander from 'commander'

jest.mock('commander', () => {
  const commander = jest.requireActual('commander')
  commander.args = ['test']
  commander.parse = jest.fn()
  commander.outputHelp = jest.fn()
  commander.help = jest.fn()
  return commander
})
jest.mock('fs')
jest.mock('../transform/pocl-transform-stream.js')
jest.mock('../staging/pocl-data-staging.js')
jest.mock('../pocl-processor.js')

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
