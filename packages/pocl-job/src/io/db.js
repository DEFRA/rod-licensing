import { AWS } from '@defra-fish/connectors-lib'
const { docClient } = AWS()
const STAGING_TTL_DELTA = process.env.POCL_STAGING_TTL || 60 * 60 * 168

/**
 * Update the POCL file staging table to add or update the entry for the provided filename
 *
 * @param {string} filename the primary key of the record in the file staging table to add/update
 * @param {Object} entries to update the table with
 * @returns {Promise<void>}
 */
export const updateFileStagingTable = async ({ filename, ...entries }) => {
  const data = { expires: Math.floor(Date.now() / 1000) + STAGING_TTL_DELTA, ...entries }
  const setFieldExpression = Object.keys(data).map(k => `${k} = :${k}`)
  const expressionAttributeValues = Object.entries(data).reduce((acc, [k, v]) => ({ ...acc, [`:${k}`]: v }), {})
  await docClient
    .update({
      TableName: process.env.POCL_FILE_STAGING_TABLE,
      Key: { filename },
      UpdateExpression: `SET ${setFieldExpression}`,
      ExpressionAttributeValues: expressionAttributeValues
    })
    .promise()
}

/**
 * Retrieve all file records for the specified stages.  If stages are not provided then all records are returned
 *
 * @param {string} stages the stage names to filter the result-set on. Omit to retrieve all records regardless of the stage.
 * @returns {Promise<[DocumentClient.AttributeMap]>}
 */
export const getFileRecords = async (...stages) => {
  const stageValues = stages.reduce((acc, s, i) => ({ ...acc, [`:stage${i}`]: s }), {})
  return executePagedOperation(docClient.scan, {
    TableName: process.env.POCL_FILE_STAGING_TABLE,
    ...(stages.length && { FilterExpression: `stage IN (${Object.keys(stageValues)})` }),
    ExpressionAttributeValues: stageValues,
    ConsistentRead: true
  })
}

/**
 * Retrieve an individual file record by the specified filename
 *
 * @param filename the name of the POCL file to retrieve a record for
 * @returns {DocumentClient.AttributeMap}
 */
export const getFileRecord = async filename => {
  const result = await docClient.get({ TableName: process.env.POCL_FILE_STAGING_TABLE, Key: { filename }, ConsistentRead: true }).promise()
  return result.Item
}

/**
 * Update the POCL record staging table to add entries for each of the provided records
 *
 * @param {string} filename the filename of a POCL file to which the records relate
 * @param {Array<Object>} records to update the table with
 * @returns {Promise<void>}
 */
export const updateRecordStagingTable = async (filename, records) => {
  if (records.length) {
    const params = {
      RequestItems: {
        [process.env.POCL_RECORD_STAGING_TABLE]: records.map(record => ({
          PutRequest: { Item: { filename, expires: Math.floor(Date.now() / 1000) + STAGING_TTL_DELTA, ...record } }
        }))
      }
    }
    await docClient.batchWrite(params).promise()
  }
}

/**
 * Retrieve processed records from the record staging table for the provided filename and stage filters
 *
 * @param {string} filename the filename of a POCL file for which the records should be retrieved
 * @param {string} stages the stage names to filter the result-set on. Omit to retrieve all records regardless of the stage.
 * @returns {Promise<[DocumentClient.AttributeMap]>}
 */
export const getProcessedRecords = async (filename, ...stages) => {
  const stageValues = stages.reduce((acc, s, i) => ({ ...acc, [`:stage${i}`]: s }), {})
  return executePagedOperation(docClient.query, {
    TableName: process.env.POCL_RECORD_STAGING_TABLE,
    KeyConditionExpression: 'filename = :filename',
    ...(stages.length && { FilterExpression: `stage IN (${Object.keys(stageValues)})` }),
    ExpressionAttributeValues: { ':filename': filename, ...stageValues },
    ConsistentRead: true
  })
}

/***
 * Support DynamoDB query/scan operations which may paginate results
 *
 * @param operation reference to the function to call on the DynamoDB DocumentClient
 * @param params the parameters to pass to the DynamoDB operation
 * @returns {Promise<[DocumentClient.AttributeMap]>}
 */
const executePagedOperation = async (operation, params) => {
  const items = []
  let lastEvaluatedKey = null
  do {
    const response = await operation({ ...params, ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }) }).promise()
    lastEvaluatedKey = response.LastEvaluatedKey
    response.Items && items.push(...response.Items)
  } while (lastEvaluatedKey)
  return items
}
