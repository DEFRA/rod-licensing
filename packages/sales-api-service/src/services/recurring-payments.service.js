import { executeQuery, findById, findDueRecurringPayments, findRecurringPaymentsByAgreementId, persist, RecurringPayment, dynamicsClient } from '@defra-fish/dynamics-lib'
import { calculateEndDate, generatePermissionNumber } from './permissions.service.js'
import { getObfuscatedDob } from './contacts.service.js'
import { createHash } from 'node:crypto'
import { ADVANCED_PURCHASE_MAX_DAYS, PAYMENT_JOURNAL_STATUS_CODES, PAYMENT_TYPE, TRANSACTION_SOURCE } from '@defra-fish/business-rules-lib'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_QUEUE } from '../config.js'
import { TRANSACTION_STATUS } from '../services/transactions/constants.js'
import { retrieveStagedTransaction } from '../services/transactions/retrieve-transaction.js'
import { createPaymentJournal, getPaymentJournal, updatePaymentJournal } from '../services/paymentjournals/payment-journals.service.js'
import { getReferenceDataForEntityAndId } from './reference-data.service.js'
import moment from 'moment'
import { AWS } from '@defra-fish/connectors-lib'
import { retrieveGlobalOptionSets } from '@defra-fish/dynamics-lib/src/client/entity-manager.js'
const { sqs, docClient } = AWS()

export const getRecurringPayments = date => executeQuery(findDueRecurringPayments(date))

const getNextDueDate = (startDate, issueDate, endDate) => {
  const mStart = moment(startDate)
  if (mStart.isAfter(moment(issueDate)) && mStart.isSameOrBefore(moment(issueDate).add(ADVANCED_PURCHASE_MAX_DAYS, 'days'), 'day')) {
    if (mStart.isSame(moment(issueDate), 'day')) {
      return moment(startDate).add(1, 'year').subtract(10, 'days').startOf('day').toISOString()
    }
    if (mStart.isBefore(moment(issueDate).add(10, 'days'), 'day')) {
      return moment(endDate).subtract(10, 'days').startOf('day').toISOString()
    }
    return moment(issueDate).add(1, 'year').startOf('day').toISOString()
  }
  throw new Error('Invalid dates provided for permission')
}

export const generateRecurringPaymentRecord = (transactionRecord, permission) => {
  if (transactionRecord.agreementId) {
    const [{ startDate, issueDate, endDate }] = transactionRecord.permissions
    return {
      payment: {
        recurring: {
          name: '',
          nextDueDate: getNextDueDate(startDate, issueDate, endDate),
          cancelledDate: null,
          cancelledReason: null,
          endDate,
          agreementId: transactionRecord.agreementId,
          status: 1
        }
      },
      permissions: [permission]
    }
  }
  return { payment: { recurring: false } }
}

/**
 * Process a recurring payment instruction
 * @param transactionRecord
 * @returns {Promise<{recurringPayment: RecurringPayment | null}>}
 */
export const processRecurringPayment = async (transactionRecord, contact) => {
  const hash = createHash('sha256')
  if (transactionRecord.payment?.recurring) {
    const recurringPayment = new RecurringPayment()
    hash.update(recurringPayment.uniqueContentId)
    recurringPayment.name = transactionRecord.payment.recurring.name
    recurringPayment.nextDueDate = transactionRecord.payment.recurring.nextDueDate
    recurringPayment.cancelledDate = transactionRecord.payment.recurring.cancelledDate
    recurringPayment.cancelledReason = transactionRecord.payment.recurring.cancelledReason
    recurringPayment.endDate = transactionRecord.payment.recurring.endDate
    recurringPayment.agreementId = transactionRecord.payment.recurring.agreementId
    recurringPayment.publicId = hash.digest('base64')
    recurringPayment.status = transactionRecord.payment.recurring.status
    const [permission] = transactionRecord.permissions
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.activePermission, permission)
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.contact, contact)
    return { recurringPayment }
  }
  return { recurringPayment: null }
}

export const processRPResult = async (transactionId, paymentId, createdDate) => {
  const transactionRecord = await retrieveStagedTransaction(transactionId)
  if (await getPaymentJournal(transactionId)) {
    await updatePaymentJournal(transactionId, {
      paymentReference: paymentId,
      paymentTimestamp: createdDate,
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
    })
  } else {
    await createPaymentJournal(transactionId, {
      paymentReference: paymentId,
      paymentTimestamp: createdDate,
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
    })
  }
  const [permission] = transactionRecord.permissions
  permission.issueDate = new Date().toISOString()

  permission.endDate = await calculateEndDate(permission)
  permission.referenceNumber = await generatePermissionNumber(permission, transactionRecord.dataSource)
  permission.licensee.obfuscatedDob = await getObfuscatedDob(permission.licensee)

  await docClient.update({
    TableName: TRANSACTION_STAGING_TABLE.TableName,
    Key: { id: transactionId },
    ...docClient.createUpdateExpression({
      payload: permission,
      permissions: transactionRecord.permissions,
      status: { id: TRANSACTION_STATUS.FINALISED },
      payment: {
        amount: transactionRecord.cost,
        method: TRANSACTION_SOURCE.govPay,
        source: PAYMENT_TYPE.debit,
        timestamp: new Date().toISOString()
      }
    }),
    ReturnValues: 'ALL_NEW'
  })

  await sqs.sendMessage({
    QueueUrl: TRANSACTION_QUEUE.Url,
    MessageGroupId: transactionId,
    MessageDeduplicationId: transactionId,
    MessageBody: JSON.stringify({ id: transactionId })
  })

  return { permission }
}

export const linkRecurringPayments = async (existingRecurringPaymentId, agreementId) => {
  console.log('existingRecurringPaymentId: ', existingRecurringPaymentId)
  console.log('agreementId: ', agreementId)
  const newRecurringPayment = await findNewestExistingRecurringPaymentInCrm(agreementId)
  if (newRecurringPayment) {
    const newRecurringPaymentId = newRecurringPayment.entity.id
    console.log('newRecurringPaymentId: ', newRecurringPaymentId)

    const data = await findById(RecurringPayment, existingRecurringPaymentId)
    console.log(data)

    // Updating the data directly before assigning it all to a new object doesn't work
    // Have tried a bunch of variations on this – setting it to the object, to a copy of the object, to the ID, etc etc
    // data.nextRecurringPayment = newRecurringPayment

    // So I try bindToEntity again instead...
    // const existingRecurringPayment = Object.assign(new RecurringPayment(), data)
    // console.log('BEFORE bindToEntity:')
    // console.log(existingRecurringPayment)

    // existingRecurringPayment.bindToEntity(RecurringPayment.definition.relationships.nextRecurringPayment, newRecurringPayment)
    // console.log('AFTER bindToEntity:')
    // console.log(existingRecurringPayment)

    // But bindToEntity does nothing either :(

    // Also tried this in a fit of desperation but it did not work:
    // const newRecurringPaymentData = await getReferenceDataForEntityAndId(RecurringPayment, newRecurringPaymentId)
    // console.log(newRecurringPaymentData)
    // existingRecurringPayment.bindToEntity(RecurringPayment.definition.relationships.nextRecurringPayment, newRecurringPaymentData)

    // Haven't even gotten this far because none of the above work!!
    // const result = await persist([updatedExistingRecurringPayment])
    // console.log(result)
  } else {
    console.log('No matches found')
  }
}

export const findNewestExistingRecurringPaymentInCrm = async agreementId => {
  const query = findRecurringPaymentsByAgreementId(agreementId)
  const response = await dynamicsClient.retrieveMultipleRequest(query.toRetrieveRequest())
  const optionSetData = await retrieveGlobalOptionSets().cached()
  if (response.value.length) {
    const [rcpResponseData] = response.value.sort((a, b) => Date.parse(b.defra_enddate) - Date.parse(a.defra_enddate))
    return RecurringPayment.fromResponse(rcpResponseData)
  }
  return false
}
