import {
  dynamicsClient,
  executeQuery,
  findById,
  findDueRecurringPayments,
  findRecurringPaymentsByAgreementId,
  persist,
  RecurringPayment
} from '@defra-fish/dynamics-lib'
import { calculateEndDate, generatePermissionNumber } from './permissions.service.js'
import { getObfuscatedDob } from './contacts.service.js'
import { createHash } from 'node:crypto'
import { ADVANCED_PURCHASE_MAX_DAYS, PAYMENT_JOURNAL_STATUS_CODES, PAYMENT_TYPE, TRANSACTION_SOURCE } from '@defra-fish/business-rules-lib'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_QUEUE } from '../config.js'
import { TRANSACTION_STATUS } from '../services/transactions/constants.js'
import { retrieveStagedTransaction } from '../services/transactions/retrieve-transaction.js'
import { createPaymentJournal, getPaymentJournal, updatePaymentJournal } from '../services/paymentjournals/payment-journals.service.js'
import { getGlobalOptionSetValue } from './reference-data.service.js'
import moment from 'moment'
import { AWS, govUkPayApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('sales:recurring')
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

export const generateRecurringPaymentRecord = async (transactionRecord, permission) => {
  if (transactionRecord.recurringPayment?.agreementId) {
    const agreementResponse = await getRecurringPaymentAgreement(transactionRecord.recurringPayment.agreementId)
    const lastDigitsCardNumbers = agreementResponse.payment_instrument?.card_details?.last_digits_card_number
    const [{ startDate, issueDate, endDate }] = transactionRecord.permissions
    return {
      payment: {
        recurring: {
          name: '',
          nextDueDate: getNextDueDate(startDate, issueDate, endDate),
          cancelledDate: null,
          cancelledReason: null,
          endDate,
          agreementId: transactionRecord.recurringPayment.agreementId,
          status: 1,
          last_digits_card_number: lastDigitsCardNumbers
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
    recurringPayment.name = determineRecurringPaymentName(transactionRecord, contact)
    recurringPayment.nextDueDate = transactionRecord.payment.recurring.nextDueDate
    recurringPayment.cancelledDate = transactionRecord.payment.recurring.cancelledDate
    recurringPayment.cancelledReason = transactionRecord.payment.recurring.cancelledReason
    recurringPayment.endDate = transactionRecord.payment.recurring.endDate
    recurringPayment.agreementId = transactionRecord.payment.recurring.agreementId
    recurringPayment.publicId = hash.digest('base64')
    recurringPayment.status = transactionRecord.payment.recurring.status
    recurringPayment.lastDigitsCardNumbers = transactionRecord.payment.recurring.last_digits_card_number
    const [permission] = transactionRecord.permissions
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.activePermission, permission)
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.contact, contact)
    return { recurringPayment }
  }
  return { recurringPayment: null }
}

export const getRecurringPaymentAgreement = async agreementId => {
  const response = await govUkPayApi.getRecurringPaymentAgreementInformation(agreementId)
  if (response.ok) {
    const resBody = await response.json()
    const resBodyNoCardDetails = structuredClone(resBody)

    if (resBodyNoCardDetails.payment_instrument?.card_details) {
      delete resBodyNoCardDetails.payment_instrument.card_details
    }
    debug('Successfully got recurring payment agreement information: %o', resBodyNoCardDetails)
    return resBody
  } else {
    throw new Error('Failure getting agreement in the GOV.UK API service')
  }
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

export const findNewestExistingRecurringPaymentInCrm = async agreementId => {
  const query = findRecurringPaymentsByAgreementId(agreementId)
  const response = await dynamicsClient.retrieveMultipleRequest(query.toRetrieveRequest())
  if (response.value.length) {
    const [rcpResponseData] = response.value.sort((a, b) => Date.parse(b.defra_enddate) - Date.parse(a.defra_enddate))
    return RecurringPayment.fromResponse(rcpResponseData)
  }
  return false
}

export const cancelRecurringPayment = async id => {
  const recurringPayment = await findById(RecurringPayment, id)
  if (recurringPayment) {
    console.log('RecurringPayment for cancellation: ', recurringPayment)
    const data = recurringPayment
    data.entity.cancelledDate = new Date().toISOString()
    data.entity.cancelledReason = await getGlobalOptionSetValue(RecurringPayment.definition.mappings.cancelledReason.ref, 'Payment failure')
    const updatedRecurringPayment = Object.assign(new RecurringPayment(), data)
    console.log(updatedRecurringPayment.entity)
    const result = persist([updatedRecurringPayment.entity])
    console.log(result)
  } else {
    console.log('No matches found for cancellation')
  }
}

const determineRecurringPaymentName = (transactionRecord, contact) => {
  const [dueYear] = transactionRecord.payment.recurring.nextDueDate.split('-')
  return [contact.firstName, contact.lastName, dueYear].join(' ')
}
