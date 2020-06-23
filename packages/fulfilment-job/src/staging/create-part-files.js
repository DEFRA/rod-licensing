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

/**
 * Maximum buffer size before writing to a part file.
 * This is set to 999 as the maximum size of a batch request to Dynamics is 1000 and we need to create the FulfilmentRequestFile entity as part of
 * the same request, leaving room to update 999 FulfilmentRequest entities
 */
const DYNAMICS_BATCH_BUFFER_LIMIT = Math.min(config.file.size, 999)
/** Date of execution */
const EXECUTION_DATE = moment()

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
    await persist(...toMarkAsExported)
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
    const partNumber = Math.floor(fulfilmentFile.numberOfRequests / DYNAMICS_BATCH_BUFFER_LIMIT)
    const partFileSize = Math.min(DYNAMICS_BATCH_BUFFER_LIMIT, config.file.size - fulfilmentFile.numberOfRequests)
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
    debug('Persisting updates to Dynamics')
    await persist(fulfilmentFile, ...fulfilmentRequestUpdates)
  }
}

const getTargetFulfilmentFile = async () => {
  const files = await getFulfilmentFiles()
  let targetFile = files.find(file => file.status.label === 'Pending')
  if (!targetFile) {
    targetFile = new FulfilmentRequestFile()
    targetFile.fileName = `EAFF${EXECUTION_DATE.format('YYYYMMDD')}${String(files.length + 1).padStart(4, '0')}.json`
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

const getFulfilmentFiles = async () => (await executeQuery(findFulfilmentFiles({ date: EXECUTION_DATE }))).map(r => r.entity)
