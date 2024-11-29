import { executeQuery, findDueRecurringPayments, RecurringPayment } from '@defra-fish/dynamics-lib'
import { createHash } from 'node:crypto'
import moment from 'moment'

export const getRecurringPayments = date => executeQuery(findDueRecurringPayments(date))

const getNextDueDate = (startDate, issueDate, endDate) => {
  if (moment(startDate).isSame(moment(issueDate), 'day')) {
    return moment(startDate).add(1, 'year').subtract(10, 'days').startOf('day').toISOString()
  }
  if (moment(startDate).isBefore(moment(issueDate).add(10, 'days'), 'day')) {
    return moment(endDate).subtract(10, 'days').startOf('day').toISOString()
  }
  if (moment(startDate).isSameOrAfter(moment(issueDate).add(10, 'days'), 'day')) {
    return moment(issueDate).add(1, 'year').startOf('day').toISOString()
  }
}

export const generateRecurringPaymentRecord = transactionRecord => {
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
    permissions: transactionRecord.permissions
  }
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
