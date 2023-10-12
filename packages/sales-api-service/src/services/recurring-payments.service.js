import { RecurringPayment, findByExample, findById, Permission, Contact } from '@defra-fish/dynamics-lib'

export const getRecurringPayments = async () => {
  const currentDate = new Date()
  const dueDates = []
  for (let i = 0; i <= 10; i += 2) {
    const date = new Date(currentDate)
    date.setDate(currentDate.getDate() - i)
    dueDates.push(date.toISOString().split('T')[0])
  }

  const recurringPayments = []
  for (const dueDate of dueDates) {
    // const example = createRecurringPayment('Active', null, dueDate)
    const example = new RecurringPayment()
    example.agreementId = 'AGREEMENTID12345'
    const lookup = new Contact()
    lookup.lastName = 'Dormand'

    const test = await findByExample(lookup)
    console.log(test)

    // const dueRecurringPayments = await findByExample(example)
    // console.log('dueRecurringPayments: ', dueRecurringPayments)

    // if (dueRecurringPayments !== null && dueRecurringPayments !== undefined) {
    //   recurringPayments.push(dueRecurringPayments)
    // }
  }
  return recurringPayments

  // const recurringPaymentsWithPermission = await addLinkedPermissions(recurringPayments)
  // console.log('recurring payments found: ', recurringPaymentsWithPermission)
  // return recurringPaymentsWithPermission
}

export const createRecurringPayment = (status, cancelledDate, nextDueDate) => {
  const recurringPayment = new RecurringPayment()
  recurringPayment.status = status
  recurringPayment.cancelledDate = cancelledDate
  recurringPayment.nextDueDate = nextDueDate

  return recurringPayment
}

export const addLinkedPermissions = async (recurringPayments) => {
  console.log('addLinkedPermissions')
  const recurringPaymentsWithPermission = []

  for (const recurringPayment of recurringPayments) {
    const permission = await findById(Permission, recurringPayment.activePermission.permissionReferenceNumber)
    recurringPayment.activePermission = permission
    recurringPaymentsWithPermission.push(recurringPayment)
  }

  return recurringPaymentsWithPermission
}
