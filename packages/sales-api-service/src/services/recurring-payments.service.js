import { Contact, executeQuery, findById, findDueRecurringPayments, Permission, RecurringPayment } from '@defra-fish/dynamics-lib'

export const getRecurringPayments = async date => {
  const recurringPayments = []
  const dueRecurringPayments = await executeQuery(findDueRecurringPayments(date))
  for (const rp of dueRecurringPayments) {
    rp.entity.contactId = await findById(Contact, rp.entity.contactId)
    rp.entity.activePermission = await findById(Permission, rp.entity.activePermission)
    recurringPayments.push(rp.entity)
  }
  return recurringPayments
}

/**
 * Process a recurring payment instruction
 * @param transactionRecord
 * @returns {Promise<{recurringPayment: null, contact: null}>}
 */
export const processRecurringPayment = async (transactionRecord, contact) => {
  let recurringPayment = null
  let permission = null
  if (transactionRecord.payment?.recurring) {
    recurringPayment = new RecurringPayment()
    recurringPayment.name = transactionRecord.payment.recurring.name
    recurringPayment.nextDueDate = transactionRecord.payment.recurring.nextDueDate
    recurringPayment.cancelledDate = transactionRecord.payment.recurring.cancelledDate
    recurringPayment.cancelledReason = transactionRecord.payment.recurring.cancelledReason
    recurringPayment.endDate = transactionRecord.payment.recurring.endDate
    recurringPayment.agreementId = transactionRecord.payment.recurring.agreementId
    recurringPayment.publicId = transactionRecord.payment.recurring.publicId
    recurringPayment.status = transactionRecord.payment.recurring.status
    permission = transactionRecord.permissions[0]
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.activePermission, permission)
    recurringPayment.bindToEntity(RecurringPayment.definition.relationships.contact, contact)
  }
  return { recurringPayment }
}
