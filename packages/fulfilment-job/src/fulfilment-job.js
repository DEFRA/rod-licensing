'use strict'
import fulfilmentJob from 'commander'
import { processFulfilment } from './fulfilment-processor.js'

console.log(`Running ${process.version} of node`)

fulfilmentJob.command('execute').description('Run fulfilment processor').action(processFulfilment)

// Configure help for unrecognised commands
fulfilmentJob.command('*').action(() => fulfilmentJob.help())
fulfilmentJob.parse()
fulfilmentJob.args.length || fulfilmentJob.outputHelp()
export default fulfilmentJob
