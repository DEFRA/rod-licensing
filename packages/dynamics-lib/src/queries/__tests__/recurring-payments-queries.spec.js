import { findDueRecurringPayments } from '../recurring-payment.queries.js'
import { RecurringPayment } from '../../entities/recurring-payment.entity.js'

describe('Recurring Payment Queries', () => {
  describe('findDueRecurringPayments', () => {
    it('builds a query to retrieve active recurring payments', () => {
      const date = new Date('2023-11-08')

      const query = findDueRecurringPayments(date)

      const expectedFilterParts = []
      for (let i = 0; i <= 10; i += 2) {
        const dueDate = new Date(date)
        dueDate.setDate(dueDate.getDate() - i)

        const startOfDay = new Date(dueDate)
        startOfDay.setHours(0, 0, 0)

        const endOfDay = new Date(dueDate)
        endOfDay.setHours(23, 59, 59)

        expectedFilterParts.push(
          `${RecurringPayment.definition.mappings.cancelledDate.field} eq null and ${RecurringPayment.definition.defaultFilter} and ${
            RecurringPayment.definition.mappings.nextDueDate.field
          } ge ${startOfDay.toISOString()} and ${RecurringPayment.definition.mappings.nextDueDate.field} le ${endOfDay.toISOString()}`
        )
      }

      const expectedFilter = expectedFilterParts.join(' or ')

      const expectedSelect = [
        'defra_recurringpaymentid',
        'defra_name',
        'statecode',
        'defra_nextduedate',
        'defra_cancelleddate',
        'defra_cancelledreason',
        'defra_enddate',
        'defra_agreementid',
        '_defra_activepermission_value',
        '_defra_contact_value',
        'defra_publicid'
      ]

      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_recurringpayments',
        filter: expectedFilter,
        select: expectedSelect
      })
    })
  })
})
