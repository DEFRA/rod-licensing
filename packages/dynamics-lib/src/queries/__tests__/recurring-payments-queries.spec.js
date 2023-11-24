import { findDueRecurringPayments } from '../recurring-payment.queries.js'

describe('Recurring Payment Queries', () => {
  describe('findDueRecurringPayments', () => {
    it('builds a query to retrieve active recurring payments', () => {
      const date = new Date('2023-11-08')

      const query = findDueRecurringPayments(date)

      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_recurringpayments',
        filter:
          "Microsoft.Dynamics.CRM.On(PropertyName='defra_nextduedate', PropertyValue='Wed Nov 08 2023 00:00:00 GMT+0000 (Greenwich Mean Time)')",
        select: [
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
        ],
        expand: [{ property: 'defra_Contact' }, { property: 'defra_ActivePermission' }]
      })
    })
  })
})
