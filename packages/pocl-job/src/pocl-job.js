'use strict'
import poclJob from 'commander'
import { execute } from './pocl-processor.js'

poclJob
  .command('execute')
  .description('Run full process to transfer files from the FTP endpoint, store in S3 and stage all records into Dynamics')
  .action(execute)

// Configure help for unrecognised commands
poclJob.command('*').action(() => poclJob.help())
poclJob.parse()
poclJob.args.length || poclJob.outputHelp()
export default poclJob
