import { salesApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('pocl:validation-errors')

const mapRecords = records => records.map(record => ({
  dataSource: record.dataSource.label,
  serialNumber: record.serialNumber,
  permissions: [{
    licensee: {
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      birthDate: record.birthDate,
      email: record.email,
      mobilePhone: record.mobilePhone,
      organisation: record.organisation,
      premises: record.premises,
      street: record.street,
      locality: record.locality,
      town: record.town,
      postcode: record.postcode,
      country: record.country,
      preferredMethodOfConfirmation: record.preferredMethodOfConfirmation.label,
      preferredMethodOfNewsletter: record.preferredMethodOfNewsletter.label,
      preferredMethodOfReminder: record.preferredMethodOfReminder.label
    },
    issueDate: record.transactionDate,
    startDate: record.startDate,
    permitId: record.permitId,
    ...record.concessions && { concessions: JSON.parse(record.concessions) }
  }]
}))

const reprocessValidationErrors = async records => {
  const results = await salesApi.createTransactions(mapRecords(records))

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
    debug('Failed to create transaction when reprocessing record: %o, result: %o', record, result)
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
