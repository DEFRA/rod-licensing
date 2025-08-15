'use strict'
import poclJob from 'commander'
import { execute } from './pocl-processor.js'
import path from 'path'
import fs from 'fs'

const pkgPath = path.join(process.cwd(), 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

console.log('POCL job starting at %s. name: %s. version: %s', new Date().toISOString(), pkg.name, pkg.version)

poclJob
  .command('execute')
  .description('Run full process to transfer files from the FTP endpoint, store in S3 and stage all records into Dynamics')
  .action(execute)

// Configure help for unrecognised commands
poclJob.command('*').action(() => poclJob.help())
poclJob.parse()
poclJob.args.length || poclJob.outputHelp()
export default poclJob
