import { salesApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('pocl:validation-errors')

const getOptionSetValue = data => data.label || data

const mapRecords = records => records.map(record => ({
  poclValidationErrorId: record.id,
  createTransactionPayload: {
    dataSource: getOptionSetValue(record.dataSource),
    serialNumber: record.serialNumber,
    permissions: [{
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
        preferredMethodOfConfirmation: getOptionSetValue(record.preferredMethodOfConfirmation),
        preferredMethodOfNewsletter: getOptionSetValue(record.preferredMethodOfNewsletter),
        preferredMethodOfReminder: getOptionSetValue(record.preferredMethodOfReminder)
      },
      issueDate: record.transactionDate,
      startDate: record.startDate,
      permitId: record.permitId,
      ...record.concessions && { concessions: JSON.parse(record.concessions) }
    }]
  },
  finaliseTransactionPayload: {
    payment: {
      timestamp: record.transactionDate,
      amount: record.amount,
      source: record.paymentSource,
      channelId: record.channelId,
      method: getOptionSetValue(record.methodOfPayment)
    }
  }
}))

/**
 * Calls Sales Api to update Dynamics record
 * @param {Array<Object>} failed
 */
const processFailedCreationResults = async failed => {
  for (const { record, result } of failed) {
    debug('Failed to create transaction when reprocessing record: %o, result: %o', record, result)
    await salesApi.updatePoclValidationError(record.poclValidationErrorId, record)
  }
}

const processSuccessfulFinalisationResults = async succeeded => {
  for (const { record } of succeeded) {
    debug('Successfully finalised transaction when reprocessing record: %o', record)
    await salesApi.updatePoclValidationError(record.poclValidationErrorId, { ...record, status: 'Processed' })
  }
}

const createTransactions = async records => {
  const results = await salesApi.createTransactions(records.map(rec => rec.createTransactionPayload))

  const succeeded = []
  const failed = []
  records.forEach((record, idx) => {
    const result = results[idx]
      ; (result.statusCode === 201 ? succeeded : failed).push({ record, result })
  })

  debug('Successfully created %d transactions', succeeded.length)

  // handle further validation errors
  await processFailedCreationResults(failed)

  return { succeeded, failed }
}

const finaliseTransactions = async records => {
  const finalisationResults = await Promise.allSettled(
    records.map(r =>
      salesApi.finaliseTransaction(r.result.response.id, r.record.finaliseTransactionPayload)
    ))

  const succeeded = []
  const failed = []
  records.forEach((record, idx) => {
    const result = finalisationResults[idx]
    if (result.status === 'fulfilled') {
      succeeded.push({ record, response: result.value })
    } else if (result.reason.status === 410) {
      /*
        HTTP-410 errors indicate that the record has already been finalised.  This can occur if the process is terminated while finalising records
        (between the API call and the database update.) As the transaction has already been finalised, treat these as successful.  The data for the
        previously finalised record is returned under the data key of the error structure returned by the Sales API
       */
      succeeded.push({ record, response: result.reason.body.data })
    } else {
      failed.push({ record, reason: result.reason })
    }
  })
  debug('Successfully finalised %d transactions', succeeded.length)
  debug('Failed when finalising %d transactions', failed.length)

  // update Dynamics records
  await processSuccessfulFinalisationResults(succeeded)
  // await processFailedCreationResults(failed)

  return { succeeded, failed }
}

const reprocessValidationErrors = async records => {
  const createResults = await createTransactions(records)
  const finalisationResults = await finaliseTransactions(createResults.succeeded)
  return finalisationResults
}

export const processPoclValidationErrors = async () => {
  const validationErrorsForProcessing = await salesApi.getPoclValidationErrorsForProcessing()
  debug('Retrieved %d records for reprocessing', validationErrorsForProcessing.length)
  const { succeeded } = await reprocessValidationErrors(mapRecords(validationErrorsForProcessing))
  return succeeded
}
