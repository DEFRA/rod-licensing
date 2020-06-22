import commander from 'commander'
import { createPartFiles } from '../staging/create-part-files.js'
import { deliverFulfilmentFiles } from '../staging/deliver-fulfilment-files.js'

jest.mock('fs')
jest.mock('../staging/create-part-files.js')
jest.mock('../staging/deliver-fulfilment-files.js')

jest.mock('commander', () => {
  const commander = jest.requireActual('commander')
  commander.args = ['test']
  commander.parse = jest.fn()
  commander.outputHelp = jest.fn()
  commander.help = jest.fn()
  return commander
})

describe('fulfilment-job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('exposes an execute command to the cli', async () => {
    jest.isolateModules(async () => {
      require('../fulfilment-job.js')
      expect(commander.commands[0].name()).toBe('execute')
      await commander.commands[0]._actionHandler([])
      expect(createPartFiles).toHaveBeenCalled()
      expect(deliverFulfilmentFiles).toHaveBeenCalled()
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
      commander.args = []
      require('../fulfilment-job.js')
      expect(commander.outputHelp).toHaveBeenCalled()
    })
  })
})
