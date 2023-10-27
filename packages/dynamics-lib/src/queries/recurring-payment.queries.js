export async function findByDateRange (recurringPayments, date) {
  console.log('recurring payments queries findByDateRange')
  let dueRecurringPayments = []
  const dueDates = []
  for (let i = 0; i <= 10; i += 2) {
    const dateToCheck = new Date(date)
    dateToCheck.setDate(dateToCheck.getDate() - i)
    dueDates.push(dateToCheck)
  }

  for (const dueDate of dueDates) {
    const recurringPaymentsInDateRange = recurringPayments.filter(payment => {
      const paymentDueDate = new Date(payment.nextDueDate)
      return (
        paymentDueDate.getUTCFullYear() === dueDate.getUTCFullYear() &&
        paymentDueDate.getUTCMonth() === dueDate.getUTCMonth() &&
        paymentDueDate.getUTCDate() === dueDate.getUTCDate()
      )
    })

    if (recurringPaymentsInDateRange.length !== 0) {
      dueRecurringPayments = dueRecurringPayments.concat(recurringPaymentsInDateRange)
    }
  }

  return dueRecurringPayments
}
