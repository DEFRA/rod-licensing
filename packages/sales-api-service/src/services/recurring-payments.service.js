import { Contact, findByDateRange, findByExample, findById, permissionForLicensee, RecurringPayment } from '@defra-fish/dynamics-lib'

export const getRecurringPayments = async date => {
  // create rp thats active with no cancelled date
  const recurringPayment = new RecurringPayment()
  recurringPayment.cancelledDate = null
  // grab all rp matching no cancelled date and status active
  const activeRecurringPayments = await findByExample(recurringPayment)
  // grab all rp matching above + within date range of current date -2,-4,-6,-8,-10
  const dueRecurringPayments = await findByDateRange(activeRecurringPayments, date)
  // assign permission and contact to rp
  const dueRecurringPaymentsWithPermissionAndContact = await retrieveActivePermissionAndContact(dueRecurringPayments)
  return dueRecurringPaymentsWithPermissionAndContact
}

export const retrieveActivePermissionAndContact = async recurringPayments => {
  let recurringPaymentsWithPermission = []
  for (const recurringPayment of recurringPayments) {
    const contact = await findById(Contact, recurringPayment.contactId)
    recurringPayment.contact = contact
    const permission = permissionForLicensee(
      recurringPayment.activePermission,
      recurringPayment.contact.birthDate,
      recurringPayment.contact.postcode
    )
    recurringPayment.activePermission = permission
    recurringPaymentsWithPermission = recurringPaymentsWithPermission.concat(recurringPayment)
  }

  return recurringPaymentsWithPermission
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
