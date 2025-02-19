import { executeQuery, findDueRecurringPayments, RecurringPayment } from '@defra-fish/dynamics-lib'
import { createHash } from 'node:crypto'
import { ADVANCED_PURCHASE_MAX_DAYS } from '@defra-fish/business-rules-lib'
import moment from 'moment'

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

export const processRP = async () => {
}
