'use strict'
import rpJob from 'commander'
import { execute } from './recurring-payments-processor.js'

rpJob.command('execute').description('Initial setup of RP job').action(execute)

// Configure help for unrecognised commands
rpJob.command('*').action(() => rpJob.help())
rpJob.parse()
rpJob.args.length || rpJob.outputHelp()
export default rpJob
