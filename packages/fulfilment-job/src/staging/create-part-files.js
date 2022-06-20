import moment from 'moment'
import {
  FulfilmentRequestFile,
  FulfilmentRequest,
  executePagedQuery,
  executeQuery,
  persist,
  findUnassociatedFulfilmentRequests,
  findFulfilmentFiles
} from '@defra-fish/dynamics-lib'
import { FULFILMENT_FILE_STATUS_OPTIONSET, FULFILMENT_REQUEST_STATUS_OPTIONSET, getOptionSetEntry } from './staging-common.js'
import { writeS3PartFile } from '../transport/s3.js'
import config from '../config.js'
import db from 'debug'
const debug = db('fulfilment:staging')

/** Date of execution */
const EXECUTION_DATE = moment()
const MAX_DYNAMICS_RETRIES = 3

/**
 * Query dynamics for outstanding fulfilment requests and stage these into S3.
 *
 * @returns {Promise<void>}
 */
export const createPartFiles = async () => {
  debug('Exporting fulfilment part files')
  const staged = await executePagedQuery(findUnassociatedFulfilmentRequests(), processQueryPage)
  debug('Staged %d fulfilment requests', staged)

  const toMarkAsExported = (await getFulfilmentFiles()).filter(f => f.status.label === 'Pending')
  if (toMarkAsExported.length) {
    for (const fulfilmentFile of toMarkAsExported) {
      fulfilmentFile.status = await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Exported')
      fulfilmentFile.notes = `The fulfilment file finished exporting at ${moment().toISOString()}`
    }
    const retries = new Retries(MAX_DYNAMICS_RETRIES)
    while (retries.shouldRetry) {
      try {
        retries.attempt()
        await persist(toMarkAsExported)
        retries.success()
      } catch (e) {
        debug(`Error persisting, retrying (attempt ${retries.attempts})`, e)
      }
    }
  }
}

/**
 *
 * @param {Array<PredefinedQueryResult<FulfilmentRequest>>} page
 * @returns {Promise<void>}
 */
const processQueryPage = async page => {
  debug('Processing %d unassociated fulfilment requests retrieved in query page', page.length)
  const requestSentStatus = await getOptionSetEntry(FULFILMENT_REQUEST_STATUS_OPTIONSET, 'Sent')
  const fileExportedStatus = await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Exported')
  while (page.length) {
    const fulfilmentFile = await getTargetFulfilmentFile()
    const partNumber = Math.floor(fulfilmentFile.numberOfRequests / config.file.partFileSize)
    const partFileSize = Math.min(config.file.partFileSize, config.file.size - fulfilmentFile.numberOfRequests)
    const itemsToWrite = page.splice(0, partFileSize).map(result => ({
      fulfilmentRequest: result.entity,
      permission: result.expanded.permission.entity,
      licensee: result.expanded.permission.expanded.licensee.entity,
      permit: result.expanded.permission.expanded.permit.entity
    }))
    await writeS3PartFile(fulfilmentFile, partNumber, itemsToWrite)

    fulfilmentFile.numberOfRequests += itemsToWrite.length
    if (fulfilmentFile.numberOfRequests === config.file.size) {
      fulfilmentFile.status = fileExportedStatus
      fulfilmentFile.notes = `The fulfilment file finished exporting at ${moment().toISOString()}`
    }

    const fulfilmentRequestUpdates = itemsToWrite.map(item => {
      item.fulfilmentRequest.status = requestSentStatus
      item.fulfilmentRequest.bindToEntity(FulfilmentRequest.definition.relationships.fulfilmentRequestFile, fulfilmentFile)
      return item.fulfilmentRequest
    })
    const retries = new Retries(MAX_DYNAMICS_RETRIES)
    while (retries.shouldRetry) {
      try {
        retries.attempt()
        await persist([fulfilmentFile, ...fulfilmentRequestUpdates])
        retries.success()
      } catch (e) {
        console.log(`Error persisting, retrying (attempt ${retries.attempts})`, e)
        debug(`Error persisting, retrying (attempt ${retries.attempts})`, e)
      }
    }
  }
}

class Retries {
  constructor (maximumAttempts) {
    this.shouldRetry = true
    this.attempts = 0
    this.maximumAttempts = maximumAttempts
  }

  success () {
    this.shouldRetry = false
  }

  attempt () {
    this.attempts++
    if (this.maximumAttempts === this.attempts) {
      this.shouldRetry = false
    }
  }
}

const getTargetFulfilmentFile = async () => {
  const files = await getFulfilmentFiles()
  let targetFile = files.find(file => file.status.label === 'Pending')
  if (!targetFile) {
    targetFile = new FulfilmentRequestFile()
    targetFile.fileName = `EAFF${EXECUTION_DATE.format('YYYYMMDD')}${String(getNextInSequence(files)).padStart(4, '0')}.json`
    targetFile.date = EXECUTION_DATE
    targetFile.status = await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Pending')
    targetFile.notes = 'The fulfilment file is currently being populated prior to exporting.'
    targetFile.numberOfRequests = 0
    debug('Starting to populate records into fulfilment file %o', targetFile)
  } else {
    debug('Continuing to populate additional records into fulfilment file %o', targetFile)
  }
  return targetFile
}

/**
 * Calculate the next sequence number based on any existing files.
 *
 * @param files the existing fileset
 * @returns {number} the next sequence number to be used
 */
const getNextInSequence = files =>
  files.reduce((acc, file) => Math.max(acc, 1 + Number.parseInt(/^EAFF\d{8}0*(?<seq>\d+).json$/.exec(file.fileName).groups.seq)), 1)

const getFulfilmentFiles = async () => (await executeQuery(findFulfilmentFiles({ date: EXECUTION_DATE }))).map(r => r.entity)
