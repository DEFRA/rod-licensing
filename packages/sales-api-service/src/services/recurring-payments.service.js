import { executeQuery, findDueRecurringPayments, RecurringPayment } from '@defra-fish/dynamics-lib'
import { calculateEndDate, generatePermissionNumber } from './permissions.service.js'
import { getAdjustedStartDate } from '../services/transactions/finalise-transaction.js'
import { getObfuscatedDob } from './contacts.service.js'
import { createHash } from 'node:crypto'
import { ADVANCED_PURCHASE_MAX_DAYS, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_QUEUE } from '../config.js'
import { TRANSACTION_STATUS } from '../services/transactions/constants.js'
import { retrieveStagedTransaction } from '../services/transactions/retrieve-transaction.js'
import { createPaymentJournal, getPaymentJournal, updatePaymentJournal } from '../services/paymentjournals/payment-journals.service.js'
import moment from 'moment'
import { AWS } from '@defra-fish/connectors-lib'
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
  console.log('processRPResult: ', transactionId, paymentId, createdDate)
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
  permission.issueDate = moment(permission.issueDate).add(1, 'year').toDate()
  const startDate = moment(permission.startDate).add(1, 'year').toDate()

  permission.startDate = getAdjustedStartDate({
    startDate,
    dataSource: transactionRecord.dataSource,
    issueDate: permission.issueDate
  })
  permission.endDate = await calculateEndDate(permission)
  permission.referenceNumber = await generatePermissionNumber(permission, transactionRecord.dataSource)
  permission.licensee.obfuscatedDob = await getObfuscatedDob(permission.licensee)

  try {
    const r = await docClient.get({ TableName: TRANSACTION_STAGING_TABLE.TableName, Key: { transactionId } })
    const item = await r.send()
    console.log(`${(new Date()).toISOString()} item: `, item)
  } catch (e) {
    console.log('error getting item', e)
  }

  try {
    // console.log('update expresssion: ', JSON.stringify(docClient.createUpdateExpression({
    //   payload: permission,
    //   permissions: transactionRecord.permissions,
    //   status: { id: TRANSACTION_STATUS.FINALISED }
    // }), undefined, '\t'))
    await docClient
      .update({
        TableName: TRANSACTION_STAGING_TABLE.TableName,
        Key: { id: transactionId },
        ...docClient.createUpdateExpression({
          payload: permission,
          permissions: transactionRecord.permissions,
          status: { id: TRANSACTION_STATUS.FINALISED }
        }),
        ReturnValues: 'ALL_NEW'
      })
      .promise()
  } catch (e) {
    console.log('error updating item', e)
  }

  // try {
  //   await sqs
  //     .sendMessage({
  //       QueueUrl: TRANSACTION_QUEUE.Url,
  //       MessageGroupId: transactionId,
  //       MessageDeduplicationId: transactionId,
  //       MessageBody: JSON.stringify({ transactionId })
  //     })
  //     .promise()
  // } catch (e) {
  //   console.log('sqs: ', e)
  // }
  return { permission }
}
