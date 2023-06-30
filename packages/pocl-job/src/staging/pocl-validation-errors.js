import { salesApi } from '@defra-fish/connectors-lib'
import { POSTAL_ORDER_DATASOURCE, POSTAL_ORDER_PAYMENTSOURCE, POSTAL_ORDER_PAYMENTMETHOD } from './constants.js'
import moment from 'moment'
import db from 'debug'
const debug = db('pocl:validation-errors')

const mapRecords = records => {
  records.forEach((r, idx) => {
    console.log(`record ${idx + 1}`, JSON.stringify(r, undefined, '\t'))
  })
  return records.map(record => ({
    poclValidationErrorId: record.id,
    createTransactionPayload: {
      dataSource: backfillDataSource(record),
      serialNumber: backfillSerialNumber(record),
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
          issueDate: formatDateToShortenedISO(record.transactionDate, 'issueDate'),
          startDate: formatDateToShortenedISO(record.startDate, 'startDate'),
          newStartDate: formatDateToShortenedISO(record.startDate, 'newStartDate'),
          permitId: record.permitId,
          ...(record.concessions && { concessions: JSON.parse(record.concessions) })
        }
      ]
    },
    finaliseTransactionPayload: {
      ...(record.transactionFile ? {transactionFile: record.transactionFile} : {}),
      payment: {
        timestamp: formatDateToShortenedISO(record.transactionDate, 'payment timestamp'),
        amount: record.amount,
        source: record.paymentSource,
        newPaymentSource: record.paymentSource,
        channelId: record.channelId,
        method: backfillPaymentMethod(record.methodOfPayment, record.newPaymentSource)
      }
    }
  }))
}
const backfillDataSource = record => {
  if (record.dataSource) {
    return record.dataSource.label
  } else if (record.newPaymentSource && record.newPaymentSource.label === POSTAL_ORDER_PAYMENTSOURCE) {
    return POSTAL_ORDER_DATASOURCE
  }
}

const backfillSerialNumber = record => {
  if (record.serialNumber) {
    return record.serialNumber
  } else if (record.newPaymentSource && record.newPaymentSource.label === POSTAL_ORDER_PAYMENTSOURCE) {
    return POSTAL_ORDER_DATASOURCE
  }
}

const backfillPaymentMethod = (method, newPaymentSource) => {
  if (method) {
    return method.label
  } else if (newPaymentSource && newPaymentSource.label === POSTAL_ORDER_PAYMENTSOURCE) {
    return POSTAL_ORDER_PAYMENTMETHOD
  }
}

const formatDateToShortenedISO = (date, field) => {
  debug('Processing date field ' + field + date)
  const manuallyEnteredDateFormat = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/

  if (date.match(manuallyEnteredDateFormat)) {
    const formattedDate = moment(date, 'DD/MM/YYYY').toDate().toISOString().split('.')[0] + 'Z'
    debug('Date ' + field + ' reformatted to ' + formattedDate)
    return formattedDate
  } else {
    return date
  }
}

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
  const results = await salesApi.createTransactions(records.map(rec => rec.createTransactionPayload))

  const succeeded = []
  const failed = []
  records.forEach((record, idx) => {
    const result = results[idx]
    ;(result.statusCode === 201 ? succeeded : failed).push({ record, result })
  })

  return { succeeded, failed }
}

const finaliseTransaction = async rec => {
  const payment = rec.record.finaliseTransactionPayload.payment
  const finaliseTransactionPayload = {
    payment: { method: backfillPaymentMethod(payment.method, payment.newPaymentSource) },
    ...rec.record.finaliseTransactionPayload
  }
  return salesApi.finaliseTransaction(rec.result.response.id, finaliseTransactionPayload)
}

const finaliseTransactions = async records => {
  const { succeeded: created, failed } = records
  const finalisationResults = await Promise.allSettled(created.map(rec => finaliseTransaction(rec)))

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
