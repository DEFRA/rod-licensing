import { salesApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('pocl:validation-errors')

const reprocessValidationErrors = async records => {
  const results = await Promise.all(records.map(record => salesApi.createTransaction(record)))

  const succeeded = []
  const failed = []
  records.forEach((record, idx) => {
    const result = results[idx]
      ; (result.statusCode === 201 ? succeeded : failed).push({ record, result })
  })

  return { succeeded, failed }
}
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
  const validationErrorsForProcessing = await salesApi.getPoclValidationErrorsForProcessing()
  debug('Retrieved %d records for reprocessing', validationErrorsForProcessing.length)
  const { succeeded, failed } = await reprocessValidationErrors(validationErrorsForProcessing)
  debug('Successfully reprocessed %d POCL validation errors', succeeded.length)

  await processFailed(failed)
}
