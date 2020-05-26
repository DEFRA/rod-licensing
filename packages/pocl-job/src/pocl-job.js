'use strict'
import poclJob from 'commander'
import { transform } from './transform/pocl-transform-stream.js'
import { stage } from './staging/pocl-data-staging.js'
import { execute } from './pocl-processor.js'
import JSONStream from 'JSONStream'
import fs from 'fs'
poclJob
  .command('transform <xml-file-path> <output-file>')
  .description('Convert the file at the given path from XML to JSON')
  .action(async function (xmlFilePath, outputFile) {
    await transform(xmlFilePath, JSONStream.stringify(), fs.createWriteStream(outputFile))
  })

poclJob
  .command('stage <xml-file-path>')
  .description('Stage the file at the given path into DynamoDB')
  .action(async function (xmlFilePath) {
    await stage(xmlFilePath)
  })

poclJob
  .command('execute')
  .description('Run full process to transfer files from the FTP endpoint, store in S3 and stage all records into Dynamics')
  .action(execute)

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

// Configure help for unrecognised commands
poclJob.command('*').action(() => poclJob.help())
poclJob.parse()
poclJob.args.length || poclJob.outputHelp()
export default poclJob
