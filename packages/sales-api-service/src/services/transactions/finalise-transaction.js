import { TRANSACTION_STATUS } from './constants.js'
import { retrieveStagedTransaction } from './retrieve-transaction.js'
import { calculateEndDate, generatePermissionNumber } from '../permissions.service.js'
import { getObfuscatedDob } from '../contacts.service.js'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_QUEUE } from '../../config.js'
import { POCL_TRANSACTION_SOURCES, START_AFTER_PAYMENT_MINUTES } from '@defra-fish/business-rules-lib'
import moment from 'moment'
import Boom from '@hapi/boom'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
import { logStartDateError } from '../permission-helper.js'
const { sqs, docClient } = AWS()
const debug = db('sales:transactions')

const getAdjustedLicenseDates = ({ issueDate, startDate, endDate, dataSource }) => {
  const adjustedDates = { startDate, endDate }
  const startDateTooEarly = moment(startDate).isBefore(moment(issueDate).add(START_AFTER_PAYMENT_MINUTES, 'minutes'))
  const webOrTelesales = !POCL_TRANSACTION_SOURCES.includes(dataSource)
  if (startDateTooEarly && webOrTelesales) {
    const licenceLength = moment(endDate).subtract(moment(startDate))
    adjustedDates.startDate = moment(issueDate).add(START_AFTER_PAYMENT_MINUTES, 'minutes').toISOString()
    adjustedDates.endDate = moment(issueDate).add(START_AFTER_PAYMENT_MINUTES, 'minutes').add(licenceLength).toISOString()
  }
  return adjustedDates
}

export async function finaliseTransaction ({ id, ...payload }) {
  debug('Finalising transaction %s', id)
  const transactionRecord = await retrieveStagedTransaction(id)

  if (transactionRecord.status?.id === TRANSACTION_STATUS.FINALISED) {
    throw Boom.resourceGone('The transaction has already been finalised', transactionRecord)
  }
  if (transactionRecord.cost !== payload.payment.amount) {
    throw Boom.paymentRequired('The payment amount did not match the cost of the transaction')
  }
  if (!transactionRecord.isRecurringPaymentSupported && payload.payment.recurring) {
    throw Boom.conflict('The transaction does not support recurring payments but an instruction was supplied')
  }

  // Generate derived fields
  for (const permission of transactionRecord.permissions) {
    permission.issueDate = permission.issueDate ?? payload.payment.timestamp
    permission.referenceNumber = await generatePermissionNumber(permission, transactionRecord.dataSource)
    permission.licensee.obfuscatedDob = await getObfuscatedDob(permission.licensee)

    const startDate =
      permission.startDate ??
      moment(payload.payment.timestamp)
        .add(START_AFTER_PAYMENT_MINUTES, 'minutes')
        .toISOString()

    const endDate = await calculateEndDate(permission)
    const adjustedDates = getAdjustedLicenseDates({
      startDate,
      endDate,
      dataSource: transactionRecord.dataSource,
      issueDate: permission.issueDate
    })
    permission.startDate = adjustedDates.startDate
    permission.endDate = adjustedDates.endDate

    logStartDateError(permission)
  }

  const { Attributes: updatedRecord } = await docClient
    .update({
      TableName: TRANSACTION_STAGING_TABLE.TableName,
      Key: { id },
      ...docClient.createUpdateExpression({
        ...payload,
        permissions: transactionRecord.permissions,
        status: { id: TRANSACTION_STATUS.FINALISED }
      }),
      ReturnValues: 'ALL_NEW'
    })
    .promise()
  debug('Updated transaction record for identifier %s', id)

  const receipt = await sqs
    .sendMessage({
      QueueUrl: TRANSACTION_QUEUE.Url,
      MessageGroupId: id,
      MessageDeduplicationId: id,
      MessageBody: JSON.stringify({ id })
    })
    .promise()

  debug('Sent transaction %s to staging queue with message-id %s', id, receipt.MessageId)
  updatedRecord.status.messageId = receipt.MessageId
  return updatedRecord
}
