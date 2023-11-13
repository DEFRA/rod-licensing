import { RecurringPayment } from '../entities/recurring-payment.entity.js'
import { PredefinedQuery } from './predefined-query.js'

/**
 * Builds a query to retrieve active recurring payment and related entities for a given date
 *
 * @param date current date used for lookup
 * @returns {PredefinedQuery}
 */
export const findDueRecurringPayments = date => {
  let filter = ''
  const dueDates = []
  for (let i = 0; i <= 10; i += 2) {
    const dateToCheck = new Date(date)
    dateToCheck.setDate(dateToCheck.getDate() - i)
    dueDates.push(dateToCheck)
  }

  for (const dueDate of dueDates) {
    const startOfDay = new Date(dueDate)
    startOfDay.setHours(0, 0, 0)

    const endOfDay = new Date(dueDate)
    endOfDay.setHours(23, 59, 59)

    filter += `${RecurringPayment.definition.mappings.cancelledDate.field} eq null and ${RecurringPayment.definition.defaultFilter} and ${
      RecurringPayment.definition.mappings.nextDueDate.field
    } ge ${startOfDay.toISOString()} and ${RecurringPayment.definition.mappings.nextDueDate.field} le ${endOfDay.toISOString()} or `
  }

  filter = filter.replace(/\sor\s$/, '')

  return new PredefinedQuery({
    root: RecurringPayment,
    filter: filter
  })
}
