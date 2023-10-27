import { Contact, findByDateRange, findByExample, findById, permissionForLicensee, RecurringPayment } from '@defra-fish/dynamics-lib'

export const getRecurringPayments = async date => {
  console.log('service getRecurringPayments', date)
  // create rp thats active with no cancelled date
  // const recurringPayment = new RecurringPayment()
  // recurringPayment.cancelledDate = null
  // console.log('service getRecurringPayments 2: ', recurringPayment)
  // // grab all rp matching no cancelled date and status active
  // const activeRecurringPayments = await findByExample(recurringPayment)
  // console.log('service getRecurringPayments 3')
  // // grab all rp matching above + within date range of current date -2,-4,-6,-8,-10
  // const dueRecurringPayments = await findByDateRange(activeRecurringPayments, date)
  // // assign permission and contact to rp
  // const dueRecurringPaymentsWithPermissionAndContact = await retrieveActivePermissionAndContact(dueRecurringPayments)

  // console.log('Recurring payments: ', dueRecurringPaymentsWithPermissionAndContact)
  // return dueRecurringPaymentsWithPermissionAndContact
}

export const retrieveActivePermissionAndContact = async recurringPayments => {
  console.log('service retrieveActivePermissionAndContact')
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
