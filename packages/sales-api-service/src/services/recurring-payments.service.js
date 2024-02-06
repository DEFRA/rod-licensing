import { executeQuery, findDueRecurringPayments, RecurringPayment } from '@defra-fish/dynamics-lib'
import { ageConcessionHelper } from '@defra-fish/business-rules-lib'

export const getRecurringPayments = async date => {
  const recurringPayments = await executeQuery(findDueRecurringPayments(date))
  recurringPayments.forEach(recurringPayment => {
    recurringPayment.expanded.activePermission.entity = ageConcessionHelper(
      recurringPayment.expanded.activePermission.entity,
      true,
      recurringPayment.expanded.contact.entity
    )
  })
  return recurringPayments
}

/**
 * Process a recurring payment instruction
 * @param transactionRecord
 * @returns {Promise<{recurringPayment: null, contact: null}>}
 */
export const processRecurringPayment = async (transactionRecord, contact) => {
  if (transactionRecord.payment?.recurring) {
    const recurringPayment = new RecurringPayment()
    recurringPayment.name = transactionRecord.payment.recurring.name
    recurringPayment.nextDueDate = transactionRecord.payment.recurring.nextDueDate
    recurringPayment.cancelledDate = transactionRecord.payment.recurring.cancelledDate
    recurringPayment.cancelledReason = transactionRecord.payment.recurring.cancelledReason
    recurringPayment.endDate = transactionRecord.payment.recurring.endDate
    recurringPayment.agreementId = transactionRecord.payment.recurring.agreementId
    recurringPayment.publicId = transactionRecord.payment.recurring.publicId
    recurringPayment.status = transactionRecord.payment.recurring.status
    const [permission] = transactionRecord.permissions
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.activePermission, permission)
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.contact, contact)
    return { recurringPayment }
  }
  return { recurringPayment: null }
}
