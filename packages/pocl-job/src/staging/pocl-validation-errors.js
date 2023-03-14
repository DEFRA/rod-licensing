import { salesApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('pocl:validation-errors')

const mapRecords = records =>
  records.map(record => ({
    poclValidationErrorId: record.id,
    createTransactionPayload: {
      dataSource: record.dataSource.label,
      serialNumber: record.serialNumber,
      permissions: [
        {
          licensee: {
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
            preferredMethodOfReminder: record.preferredMethodOfReminder.label,
            postalFulfilment: record.postalFulfilment
          },
          issueDate: record.transactionDate,
          startDate: record.startDate,
          permitId: record.permitId,
          ...(record.concessions && { concessions: JSON.parse(record.concessions) })
        }
      ]
    },
    finaliseTransactionPayload: {
      transactionFile: record.transactionFile,
      payment: {
        timestamp: record.transactionDate,
        amount: record.amount,
        source: record.paymentSource,
        channelId: record.channelId,
        method: record.methodOfPayment.label
      }
    }
  }))

/**
 * Calls Sales Api to update Dynamics record
 * @param {Array<Object>} failed
 */
const processFailed = async failed => {
  for (const { record, result } of failed) {
    debug('Failed when reprocessing record: %o', record)
    await salesApi.updatePoclValidationError(record.poclValidationErrorId, { ...record, errorMessage: result.message })
  }
}

const processSucceeded = async succeeded => {
  for (const { record } of succeeded) {
    debug('Successfully reprocessed record: %o', record)
    await salesApi.updatePoclValidationError(record.poclValidationErrorId, { ...record, status: 'Processed' })
  }
}

const createTransactions = async records => {
  debug('creating transactions', JSON.stringify(records, undefined, '\t'))
  const results = await salesApi.createTransactions(records.map(rec => rec.createTransactionPayload))

  const succeeded = []
  const failed = []
  records.forEach((record, idx) => {
    const result = results[idx]
    ;(result.statusCode === 201 ? succeeded : failed).push({ record, result })
  })

  return { succeeded, failed }
}

const finaliseTransactions = async records => {
  const { succeeded: created, failed } = records
  const finalisationResults = await Promise.allSettled(
    created.map(rec => salesApi.finaliseTransaction(rec.result.response.id, rec.record.finaliseTransactionPayload))
  )

  const succeeded = []
  created.forEach(({ record }, idx) => {
    const result = finalisationResults[idx]
    if (result.status === 'fulfilled') {
      succeeded.push({ record, result: result.value })
    } else if (result.reason.status === 410) {
      /*
        HTTP-410 errors indicate that the record has already been finalised.  This can occur if the process is terminated while finalising records
        (between the API call and the database update.) As the transaction has already been finalised, treat these as successful.  The data for the
        previously finalised record is returned under the data key of the error structure returned by the Sales API
       */
      succeeded.push({ record, result: result.reason.body.data })
    } else {
      failed.push({ record, result: result.reason })
    }
  })

  // updates Dynamics records
  await processSucceeded(succeeded)
  await processFailed(failed)

  return { succeeded, failed }
}

export const processPoclValidationErrors = async () => {
  const validationErrors = await salesApi.getPoclValidationErrorsForProcessing()
  if (!Array.isArray(validationErrors) || !validationErrors.length) {
    debug('No POCL validation errors to process')
    return undefined
  }
  const createResults = await createTransactions(mapRecords(validationErrors))
  return finaliseTransactions(createResults)
}
