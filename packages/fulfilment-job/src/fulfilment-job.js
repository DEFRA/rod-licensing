'use strict'
import fulfilmentJob from 'commander'
import { createPartFiles } from './staging/create-part-files.js'
import { deliverFulfilmentFiles } from './staging/deliver-fulfilment-files.js'

fulfilmentJob
  .command('execute')
  .description('Run fulfilment processor')
  .action(async () => {
    await createPartFiles()
    await deliverFulfilmentFiles()
  })

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

// Configure help for unrecognised commands
fulfilmentJob.command('*').action(() => fulfilmentJob.help())
fulfilmentJob.parse()
fulfilmentJob.args.length || fulfilmentJob.outputHelp()
export default fulfilmentJob
