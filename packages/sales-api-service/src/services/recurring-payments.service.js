import { findByExample, findById, Permission, RecurringPayment } from '@defra-fish/dynamics-lib'

export const getRecurringPayments = async () => {
  const currentDate = new Date()
  const dueDates = []
  for (let i = 0; i <= 10; i += 2) {
    const date = new Date(currentDate)
    date.setDate(currentDate.getDate() - i)
    dueDates.push(date)
  }

  const recurringPayments = []
  for (const dueDate of dueDates) {
    const activeRecurringPayments = await findByExample(new RecurringPayment())
    const dueRecurringPayments = await findRecurringPaymentsInDateRange(activeRecurringPayments, dueDate)

    if (dueRecurringPayments.length !== 0) {
      recurringPayments.push(dueRecurringPayments)
    }
  }

  return recurringPayments
}

export const retrieveActivePermission = async recurringPayments => {
  const recurringPaymentsWithPermission = []
  for (const recurringPayment of recurringPayments) {
    const permission = await findById(Permission, recurringPayment.activePermission)
    recurringPayment.activePermission = permission
    recurringPaymentsWithPermission.push(recurringPayment)
  }
  return recurringPaymentsWithPermission
}

export const findRecurringPaymentsInDateRange = async (recurringPayments, dueDate) => {
  try {
    const recurringPaymentsInDateRange = recurringPayments.filter(payment => {
      const paymentDueDate = new Date(payment.nextDueDate)

      return (
        paymentDueDate.getUTCFullYear() === dueDate.getUTCFullYear() &&
        paymentDueDate.getUTCMonth() === dueDate.getUTCMonth() &&
        paymentDueDate.getUTCDate() === dueDate.getUTCDate()
      )
    })

    const recurringPaymentsWithPermission = await retrieveActivePermission(recurringPaymentsInDateRange)

    return recurringPaymentsWithPermission
  } catch (error) {
    console.error('Error finding recurring payments:', error)
    throw error
  }
}
