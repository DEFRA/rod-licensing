import { salesApi } from '@defra-fish/connectors-lib'
import { getPoclValidationErrorsForProcessing } from './temp-connector.js'
import db from 'debug'
const debug = db('sales:pocl-validation-errors')

const getSucceededAndFailedRecords = (records, results) => {
  const succeeded = []
  const failed = []
  records.forEach((record, idx) => {
    const result = results[idx]
      ; (result.statusCode === 201 ? succeeded : failed).push({ record, result })
  })
}

const reprocessValidationErrors = async records =>
  Promise.all(records.map(record => salesApi.createTransactions(record)))

const processFailed = async failed => {
  for (const { record, result } of failed) {
    debug('Failed to create transaction when reprocessing record: %o', record)
    // await salesApi.createStagingException({
    //   transactionFileException: {
    //     name: `${filename}: FAILED-CREATE-${record.id}`,
    //     description: JSON.stringify(result, null, 2),
    //     json: JSON.stringify(record, null, 2),
    //     notes: 'Failed to create the transaction in the Sales API',
    //     type: 'Failure',
    //     transactionFile: filename
    //   },
    //   record
    // })
  }
}

export const processPoclValidationErrors = async () => {
  const validationErrorsForProcessing = await getPoclValidationErrorsForProcessing()
  debug('Retrieved %d records with a "Ready for Processing" status', validationErrorsForProcessing.length)
  const reprocessResults = await reprocessValidationErrors(validationErrorsForProcessing)
  const { succeeded, failed } = getSucceededAndFailedRecords(reprocessResults)

  debug('Successfully reprocessed %d POCL validation errors', succeeded.length)

  await processFailed(failed)
}
